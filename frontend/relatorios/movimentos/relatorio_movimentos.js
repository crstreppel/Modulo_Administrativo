// relatorio_movimentos.js
// Bruxão mode ON: relatório com períodos rápidos, loading, totais separados,
// flag pra mostrar/ocultar baixas de adiantamento e exportação CSV.

document.addEventListener("DOMContentLoaded", () => {
  const BASE_API = "http://localhost:3000/api";

  const form = document.getElementById("filtro-relatorio");
  const tabelaBody = document.querySelector("#tabela-relatorio tbody");
  const loading = document.getElementById("loading");
  const resumoTotal = document.getElementById("resumoTotal");
  const resumoBaixas = document.getElementById("resumoBaixas");

  const inputInicio = document.getElementById("dataInicio");
  const inputFim = document.getElementById("dataFim");
  const inputCliente = document.getElementById("clienteId");
  const inputStatus = document.getElementById("statusId");
  const chkIncluirBaixas = document.getElementById("incluirBaixas");

  const btnHoje = document.getElementById("btnHoje");
  const btn7d = document.getElementById("btn7d");
  const btnMes = document.getElementById("btnMes");
  const btnCsv = document.getElementById("btnCsv");

  // Guarda o último resultado (pra re-render e CSV)
  let lastRows = [];

  // Utils
  const hojeISO = () => new Date().toISOString().split("T")[0];
  const formatBRL = (val) =>
    (Number(val) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const setPeriodo = (di, df) => {
    inputInicio.value = di;
    inputFim.value = df;
  };

  // ⚠️ Regra correta:
  // - Baixa de adiantamento: meioPagamentoId === 3 OU adiantamentoId preenchido
  // - Entrada de adiantamento: condicao=adiantamento, meio != 3, adiantamentoId nulo -> entra no total operacional
  const isBaixaAdiantamento = (m) => {
    const meioId = Number(m?.meioDePagamento?.id);
    const adtId = m?.adiantamentoId; // precisa vir do backend em attributes
    if (Number.isFinite(meioId) && meioId === 3) return true;
    if (adtId !== null && adtId !== undefined) return true;
    return false;
  };

  // Datas padrão: hoje
  setPeriodo(hojeISO(), hojeISO());

  // Atalhos
  btnHoje.addEventListener("click", () => {
    const d = hojeISO();
    setPeriodo(d, d);
  });

  btn7d.addEventListener("click", () => {
    const fim = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - 6); // incluindo hoje
    setPeriodo(inicio.toISOString().split("T")[0], fim.toISOString().split("T")[0]);
  });

  btnMes.addEventListener("click", () => {
    const now = new Date();
    const di = new Date(now.getFullYear(), now.getMonth(), 1);
    const df = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setPeriodo(di.toISOString().split("T")[0], df.toISOString().split("T")[0]);
  });

  // Render tabela + totais (operacionais x baixas)
  const renderTabela = (rows) => {
    tabelaBody.innerHTML = "";

    let somaOperacional = 0;
    let contOperacional = 0;

    let somaBaixas = 0;
    let contBaixas = 0;

    const incluirBaixasNaLista = chkIncluirBaixas.checked;

    rows.forEach((m) => {
      const baixa = isBaixaAdiantamento(m);

      // Totais separados
      if (baixa) {
        contBaixas += 1;
        somaBaixas += Number(m.valor) || 0;
      } else {
        contOperacional += 1;
        somaOperacional += Number(m.valor) || 0;
      }

      // Decide se mostra a linha de baixa
      if (!baixa || (baixa && incluirBaixasNaLista)) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${m.id}</td>
          <td>${m.data_lancamento}</td>
          <td>${m.cliente?.nome ?? ""}</td>
          <td>${m.pet?.nome ?? ""}</td>
          <td>${m.servico?.descricao ?? ""}</td>
          <td class="right">${formatBRL(m.valor)}</td>
          <td>${m.condicaoPagamento?.descricao ?? ""}</td>
          <td>${m.meioDePagamento?.descricao ?? ""}</td>
          <td>${m.status?.descricao ?? ""}</td>
          <td>${baixa ? "Baixa de adiantamento" : "Operacional"}</td>
        `;
        tabelaBody.appendChild(tr);
      }
    });

    resumoTotal.textContent = `Operacionais — Registros: ${contOperacional} • Soma: ${formatBRL(somaOperacional)}`;
    if (chkIncluirBaixas.checked) {
      resumoBaixas.textContent = `Baixas de adiantamento — Registros: ${contBaixas} • Soma: ${formatBRL(somaBaixas)}`;
    } else {
      resumoBaixas.textContent = "";
    }
  };

  // Exporta CSV do que está visível (respeita checkbox)
  const exportCSV = () => {
    if (!lastRows.length) {
      alert("Nada para exportar.");
      return;
    }
    const incluirBaixasNaLista = chkIncluirBaixas.checked;

    const headers = [
      "ID","Data Lançamento","Cliente","Pet","Serviço","Valor","Condição","Meio","Status","Tipo"
    ];
    const lines = [headers.join(";")];

    lastRows.forEach((m) => {
      const baixa = isBaixaAdiantamento(m);
      if (!baixa || (baixa && incluirBaixasNaLista)) {
        const row = [
          m.id,
          m.data_lancamento,
          m.cliente?.nome ?? "",
          m.pet?.nome ?? "",
          m.servico?.descricao ?? "",
          (Number(m.valor) || 0).toString().replace(".", ","), // PT-BR friendly
          m.condicaoPagamento?.descricao ?? "",
          m.meioDePagamento?.descricao ?? "",
          m.status?.descricao ?? "",
          baixa ? "Baixa de adiantamento" : "Operacional",
        ];
        lines.push(
          row
            .map((cell) => {
              const s = String(cell);
              return s.includes(";") ? `"${s.replace(/"/g, '""')}"` : s;
            })
            .join(";")
        );
      }
    });

    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const di = inputInicio.value || "";
    const df = inputFim.value || "";
    a.href = url;
    a.download = `relatorio_movimentos_${di}_a_${df}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  btnCsv.addEventListener("click", exportCSV);

  // Buscar no backend
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const dataInicio = inputInicio.value;
    const dataFim = inputFim.value;
    const clienteId = inputCliente.value;
    const statusId = inputStatus.value;

    const params = new URLSearchParams();
    if (dataInicio) params.append("dataInicio", dataInicio);
    if (dataFim) params.append("dataFim", dataFim);
    if (clienteId) params.append("clienteId", clienteId);
    if (statusId) params.append("statusId", statusId);

    const url = `${BASE_API}/movimentos/relatorio?${params.toString()}`;

    try {
      loading.classList.add("show");
      tabelaBody.innerHTML = "";
      resumoTotal.textContent = "";
      resumoBaixas.textContent = "";

      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status} ao chamar ${url}\n${text}`);
      }

      const json = await res.json();
      // Espera que cada item tenha: id, data_lancamento, valor, adiantamentoId (opcional),
      // e includes: cliente.nome, pet.nome, servico.descricao,
      // condicaoPagamento.{id,descricao}, meioDePagamento.{id,descricao}, status.descricao
      lastRows = json.data || [];
      renderTabela(lastRows);
    } catch (err) {
      console.error("Erro ao buscar relatório:", err);
      alert(err.message);
    } finally {
      loading.classList.remove("show");
    }
  });

  // Re-render quando alterna exibição de baixas (sem refetch)
  chkIncluirBaixas.addEventListener("change", () => renderTabela(lastRows));

  // Auto-busca na carga
  form.dispatchEvent(new Event("submit"));
});
