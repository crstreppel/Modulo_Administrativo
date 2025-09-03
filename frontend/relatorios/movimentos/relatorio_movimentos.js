// relatorio_movimentos.js
// Bruxão mode ON: relatório com períodos rápidos, loading, totais separados,
// flag pra mostrar/ocultar baixas de adiantamento e exportação CSV.
// Agora mirando em DATA DO MOVIMENTO (data_movimento) no render e no CSV.

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

  // Utils (datas em LOCAL TIME pra não "voltar 1 dia")
  const toLocalISO = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };
  const hojeISO = () => toLocalISO(new Date());

  const formatBRL = (val) =>
    (Number(val) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const setPeriodo = (di, df) => {
    inputInicio.value = di;
    inputFim.value = df;
  };

  // ⚠️ Regra correta (robusta):
  // - **Baixa de adiantamento** se:
  //     a) meioDePagamento.id === 3  (uso do adiantamento como meio de pagamento), OU
  //     b) adiantamentoId preenchido **e** condicaoPagamento.id !== 3 (vinculado a um adiantamento existente)
  // - **Entrada de adiantamento (operacional)** se:
  //     condicaoPagamento.id === 3 **e** meioDePagamento.id !== 3
  const isBaixaAdiantamento = (m) => {
    const condId = Number(m?.condicaoPagamento?.id);
    const meioId = Number(m?.meioDePagamento?.id);
    const adtId = m?.adiantamentoId;

    // Uso explícito do adiantamento como MEIO de pagamento => baixa
    if (Number.isFinite(meioId) && meioId === 3) return true;

    // Qualquer vínculo a um adiantamento EXISTENTE conta como baixa,
    // exceto quando o próprio movimento é a ENTRADA do adiantamento (condicao = 3)
    if (adtId !== null && adtId !== undefined && condId !== 3) return true;

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
    setPeriodo(toLocalISO(inicio), toLocalISO(fim));
  });

  btnMes.addEventListener("click", () => {
    const now = new Date();
    const di = new Date(now.getFullYear(), now.getMonth(), 1);
    const df = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setPeriodo(toLocalISO(di), toLocalISO(df));
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
          <td>${m.data_movimento}</td>
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
      "ID","Data Movimento","Cliente","Pet","Serviço","Valor","Condição","Meio","Status","Tipo"
    ];
    const lines = [headers.join(";")];

    lastRows.forEach((m) => {
      const baixa = isBaixaAdiantamento(m);
      if (!baixa || (baixa && incluirBaixasNaLista)) {
        const row = [
          m.id,
          m.data_movimento,
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

  // Buscar no backend (por DATA DE MOVIMENTO, com compat + filtro local)
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const dataInicio = inputInicio.value; // YYYY-MM-DD
    const dataFim = inputFim.value;       // YYYY-MM-DD
    const clienteId = inputCliente.value;
    const statusId = inputStatus.value;

    const params = new URLSearchParams();

    // ✅ Preferência: data de movimento
    if (dataInicio) params.append("dataMovimentoInicio", dataInicio);
    if (dataFim) params.append("dataMovimentoFim", dataFim);
    params.append("tipoData", "movimento"); // se o backend suportar, ótimo

    // 🛡️ Compat: alguns endpoints ainda usam dataInicio/dataFim
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
      let rows = json.data || [];

      // 🔒 Filtro local garantido por data_movimento (inclusive)
      const di = dataInicio || null;
      const df = dataFim || null;
      if (di || df) {
        rows = rows.filter((m) => {
          const dm = String(m?.data_movimento || "");
          if (!dm) return false;
          if (di && dm < di) return false;
          if (df && dm > df) return false;
          return true;
        });
      }

      lastRows = rows;
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
