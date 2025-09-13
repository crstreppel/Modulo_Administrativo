// relatorio_movimentos_failover.js v3.0.2
// Regras:
// - Inputs começam no dia de HOJE.
// - NÃO faz busca automática ao abrir a página.
// - Ao clicar "Buscar": tenta /movimentos/relatorio-por-movimento (estrito por data_movimento).
//   Se não existir/der erro, cai para /movimentos/relatorio (legacy) com janela ampla,
//   e filtra LOCALMENTE por data_movimento = período selecionado.
// - Mantém totais e CSV, respeitando a checkbox de baixas.

document.addEventListener("DOMContentLoaded", () => {
  const BASE_API = "http://localhost:3000/api";
  const ENDPOINT_STRICT = "/movimentos/relatorio-por-movimento";
  const ENDPOINT_LEGACY = "/movimentos/relatorio";

  const form = document.getElementById("filtro-relatorio");
  const tabelaBody = document.querySelector("#tabela-relatorio tbody");
  const loading = document.getElementById("loading");
  const resumoTotal = document.getElementById("resumoTotal");
  const resumoBaixas = document.getElementById("resumoBaixas");
  const debugInfo = document.getElementById("debugInfo"); // opcional no HTML

  const inputInicio = document.getElementById("dataInicio");
  const inputFim = document.getElementById("dataFim");
  const inputCliente = document.getElementById("clienteId");
  const inputStatus = document.getElementById("statusId");
  const chkIncluirBaixas = document.getElementById("incluirBaixas");

  const btnHoje = document.getElementById("btnHoje");
  const btn7d = document.getElementById("btn7d");
  const btnMes = document.getElementById("btnMes");
  const btnCsv = document.getElementById("btnCsv");

  let lastRows = [];

  // ===== Utils =====
  const toLocalISO = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };
  const todayISO = () => toLocalISO(new Date());
  const formatBRL = (val) =>
    (Number(val) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const setPeriodo = (di, df) => { inputInicio.value = di || ""; inputFim.value = df || ""; };

  const isBaixa = (m) => {
    const condId = Number(m?.condicaoPagamento?.id);
    const meioId = Number(m?.meioDePagamento?.id);
    const adtId = m?.adiantamentoId;
    if (Number.isFinite(meioId) && meioId === 3) return true;
    if (adtId != null && condId !== 3) return true;
    return false;
  };

  // ===== Atalhos =====
  btnHoje.addEventListener("click", () => {
    const d = todayISO();
    setPeriodo(d, d);
  });
  btn7d.addEventListener("click", () => {
    const fim = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - 6);
    setPeriodo(toLocalISO(inicio), toLocalISO(fim));
  });
  btnMes.addEventListener("click", () => {
    const now = new Date();
    const di = new Date(now.getFullYear(), now.getMonth(), 1);
    const df = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setPeriodo(toLocalISO(di), toLocalISO(df));
  });

  // ===== Render =====
  const renderTabela = (rows) => {
    tabelaBody.innerHTML = "";

    let somaOp = 0, nOp = 0;
    let somaBx = 0, nBx = 0;

    const incluir = chkIncluirBaixas.checked;

    rows.forEach((m) => {
      const baixa = isBaixa(m);
      const val = Number(m?.valor) || 0;

      if (baixa) { nBx++; somaBx += val; } else { nOp++; somaOp += val; }

      if (!baixa || incluir) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${m.id}</td>
          <td>${String(m.data_movimento || "").slice(0, 10)}</td>
          <td>${m.cliente?.nome ?? ""}</td>
          <td>${m.pet?.nome ?? ""}</td>
          <td>${m.servico?.descricao ?? ""}</td>
          <td class="right">${formatBRL(val)}</td>
          <td>${m.condicaoPagamento?.descricao ?? ""}</td>
          <td>${m.meioDePagamento?.descricao ?? ""}</td>
          <td>${m.status?.descricao ?? ""}</td>
          <td>${baixa ? "Baixa de adiantamento" : "Operacional"}</td>
        `;
        tabelaBody.appendChild(tr);
      }
    });

    resumoTotal.textContent = `Operacionais — Registros: ${nOp} • Soma: ${formatBRL(somaOp)}`;
    resumoBaixas.textContent = chkIncluirBaixas.checked
      ? `Baixas de adiantamento — Registros: ${nBx} • Soma: ${formatBRL(somaBx)}`
      : "";
  };

  const setDebug = (msg) => { if (debugInfo) debugInfo.textContent = msg; };

  // ===== Fetch helpers (failover) =====
  const extractRows = (json) => {
    if (Array.isArray(json)) return json;
    if (Array.isArray(json?.data)) return json.data;
    if (Array.isArray(json?.rows)) return json.rows;
    if (Array.isArray(json?.result)) return json.result;
    return [];
  };

  // Estrito (campo data_movimento no backend)
  const fetchStrict = async (di, df, clienteId, statusId) => {
    const p = new URLSearchParams();
    if (di) p.append("dataMovimentoInicio", di);
    if (df) p.append("dataMovimentoFim", df);
    if (clienteId) p.append("clienteId", clienteId);
    if (statusId) p.append("statusId", statusId);
    const url = `${BASE_API}${ENDPOINT_STRICT}?${p.toString()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status, url });
    const json = await res.json();
    return { url, rows: extractRows(json) };
  };

  // Legacy (pode filtrar por data_lancamento; aqui usamos janela ampla e filtramos no front)
  const fetchLegacyWide = async (clienteId, statusId) => {
    const p = new URLSearchParams();
    p.append("tipoData", "movimento"); // se o controller suportar, usa; se ignorar, não atrapalha
    p.append("dataInicio", "1900-01-01");
    p.append("dataFim", "2100-12-31");
    if (clienteId) p.append("clienteId", clienteId);
    if (statusId) p.append("statusId", statusId);
    const url = `${BASE_API}${ENDPOINT_LEGACY}?${p.toString()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status, url });
    const json = await res.json();
    return { url, rows: extractRows(json) };
  };

  // ===== Submit =====
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const diUser = inputInicio.value || ""; // YYYY-MM-DD
    const dfUser = inputFim.value || "";
    const clienteId = inputCliente.value;
    const statusId = inputStatus.value;

    try {
      loading.classList.add("show");
      tabelaBody.innerHTML = "";
      resumoTotal.textContent = "";
      resumoBaixas.textContent = "";
      setDebug("");

      // 1) tenta endpoint estrito (se existir)
      let resp;
      try {
        resp = await fetchStrict(diUser, dfUser, clienteId, statusId);
      } catch (err1) {
        // 2) fallback: pega janela ampla no legacy e filtra localmente por data_movimento
        resp = await fetchLegacyWide(clienteId, statusId);
      }

      // Filtro LOCAL obrigatório por data_movimento (usa exatamente o que está nos inputs)
      let rows = resp.rows || [];

      // Se o usuário NÃO informou datas (não deve acontecer, pois iniciamos com hoje), não filtra.
      if (diUser || dfUser) {
        rows = rows.filter((m) => {
          const dm = String(m?.data_movimento || "").slice(0, 10);
          if (!dm) return false;
          if (diUser && dm < diUser) return false;
          if (dfUser && dm > dfUser) return false;
          return true;
        });
      }

      // Ordena por data_movimento asc + id asc
      rows.sort((a,b) => {
        const da = String(a?.data_movimento||"").slice(0,10);
        const db = String(b?.data_movimento||"").slice(0,10);
        if (da === db) return (Number(a.id)||0) - (Number(b.id)||0);
        return da < db ? -1 : 1;
      });

      lastRows = rows;
      setDebug(`Endpoint usado: ${resp.url} • Registros (backend): ${resp.rows.length} • Após filtro local: ${rows.length}`);
      renderTabela(lastRows);
    } catch (err) {
      console.error("Erro ao buscar relatório:", err);
      alert(err.message || String(err));
    } finally {
      loading.classList.remove("show");
    }
  });

  // ===== CSV =====
  btnCsv.addEventListener("click", () => {
    if (!lastRows.length) { alert("Nada para exportar."); return; }
    const incluir = chkIncluirBaixas.checked;
    const headers = ["ID","Data Movimento","Cliente","Pet","Serviço","Valor","Condição","Meio","Status","Tipo"];
    const lines = [headers.join(";")];
    lastRows.forEach((m) => {
      const baixa = isBaixa(m);
      if (!baixa || incluir) {
        const val = Number(m?.valor)||0;
        const row = [
          m.id,
          String(m.data_movimento||"").slice(0,10),
          m.cliente?.nome ?? "",
          m.pet?.nome ?? "",
          m.servico?.descricao ?? "",
          val.toFixed(2).replace(".",","),
          m.condicaoPagamento?.descricao ?? "",
          m.meioDePagamento?.descricao ?? "",
          m.status?.descricao ?? "",
          baixa ? "Baixa de adiantamento" : "Operacional",
        ];
        lines.push(row.map((c)=> {
          const s = String(c);
          return s.includes(";") ? `"${s.replace(/"/g,'""')}"` : s;
        }).join(";"));
      }
    });
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio_movimentos_${inputInicio.value||""}_a_${inputFim.value||""}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // ===== Inicialização: datas = HOJE e só. Sem auto-busca. =====
  (function initHojeSemAuto() {
    const d = todayISO();
    setPeriodo(d, d);
    // NÃO dispara submit aqui — só quando o usuário clicar "Buscar".
  })();
});
