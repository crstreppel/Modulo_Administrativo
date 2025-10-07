document.addEventListener("DOMContentLoaded", () => {
  console.log("🔥 cancelar_movimento.js carregado e DOM pronto");

  const el = (id) => document.getElementById(id);
  const btnBuscar = el("btnBuscar");
  const btnCancelarSelecionado = el("btnCancelarSelecionado");
  const dataMov = el("dataMov");
  const tabela = el("tabelaMovimentos").querySelector("tbody");
  const modalOverlay = el("modalOverlay");
  const modalClose = el("modalClose");
  const modalCancelar = el("modalCancelar");
  const modalConfirmar = el("modalConfirmar");
  const resumoFixo = el("resumoFixo");
  const motivoAdicional = el("motivoAdicional");
  const feedbackLista = el("feedbackLista");

  let movimentoSelecionado = null;

  // ========== Funções auxiliares ==========
  const toast = (msg, tipo = "info") => {
    const div = document.createElement("div");
    div.className = `toast ${tipo}`;
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => div.classList.add("show"), 10);
    setTimeout(() => {
      div.classList.remove("show");
      setTimeout(() => div.remove(), 400);
    }, 3000);
  };

  const formatarValor = (v) => `R$ ${parseFloat(v).toFixed(2).replace(".", ",")}`;

  const abrirModal = (movimento) => {
    resumoFixo.textContent = [
      `ID: ${movimento.id}`,
      `Cliente: ${movimento.cliente?.nome ?? "-"}`,
      `Pet: ${movimento.pet?.nome ?? "-"}`,
      `Serviço: ${movimento.servico?.descricao ?? "-"}`,
      `Valor: ${formatarValor(movimento.valor)}`,
      `Status atual: ${movimento.status?.descricao ?? "-"}`,
      `Data: ${movimento.data_movimento}`
    ].join("\n");
    motivoAdicional.value = "";
    modalOverlay.classList.remove("hidden");
    modalOverlay.removeAttribute("aria-hidden");
  };

  const fecharModal = () => {
    document.activeElement.blur(); // 👈 evita warning aria-hidden
    modalOverlay.classList.add("hidden");
    modalOverlay.setAttribute("aria-hidden", "true");
  };

  const limparTabela = () => {
    tabela.innerHTML =
      '<tr><td colspan="8" class="center muted">Selecione uma data e clique em “Buscar movimentos”.</td></tr>';
  };

  // ========== Buscar movimentos ==========
  btnBuscar.addEventListener("click", async () => {
    const data = dataMov.value;
    if (!data) {
      toast("Informe uma data para buscar.", "error");
      return;
    }

    feedbackLista.textContent = "🔍 Buscando...";
    tabela.innerHTML = "";

    try {
      const res = await axios.get(`http://localhost:3000/api/movimentos/relatorio?dataInicio=${data}&dataFim=${data}`);
      const lista = res.data.data;

      if (!lista || lista.length === 0) {
        limparTabela();
        feedbackLista.textContent = "Nenhum movimento encontrado.";
        return;
      }

      feedbackLista.textContent = "";
      tabela.innerHTML = "";

      lista.forEach((m) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><input type="checkbox" class="chkMov" data-id="${m.id}" /></td>
          <td>${m.id}</td>
          <td>${m.cliente?.nome ?? "-"}</td>
          <td>${m.pet?.nome ?? "-"}</td>
          <td>${m.servico?.descricao ?? "-"}</td>
          <td>${formatarValor(m.valor)}</td>
          <td>${m.status?.descricao ?? "-"}</td>
          <td>${m.data_movimento}</td>
        `;
        tabela.appendChild(tr);
      });

      document.querySelectorAll(".chkMov").forEach((chk) => {
        chk.addEventListener("change", (e) => {
          document.querySelectorAll(".chkMov").forEach((o) => {
            if (o !== e.target) o.checked = false;
          });
          const idSel = e.target.checked ? e.target.dataset.id : null;
          btnCancelarSelecionado.disabled = !idSel;
          if (idSel) {
            movimentoSelecionado = lista.find((m) => m.id == idSel);
          } else {
            movimentoSelecionado = null;
          }
        });
      });
    } catch (err) {
      console.error("Erro ao buscar movimentos:", err);
      toast("Erro ao buscar movimentos.", "error");
      limparTabela();
    }
  });

  // ========== Cancelar selecionado ==========
  btnCancelarSelecionado.addEventListener("click", () => {
    if (!movimentoSelecionado) {
      toast("Selecione um movimento primeiro.", "error");
      return;
    }
    abrirModal(movimentoSelecionado);
  });

  // ========== Modal ==========
  modalClose.addEventListener("click", fecharModal);
  modalCancelar.addEventListener("click", fecharModal);

  modalConfirmar.addEventListener("click", async () => {
    if (!movimentoSelecionado) {
      toast("Nenhum movimento selecionado!", "error");
      return;
    }

    const motivo = motivoAdicional.value.trim();
    const observacao =
      (resumoFixo.textContent || "") +
      (motivo ? `\nMotivo adicional: ${motivo}` : "");

    try {
      toast("⏳ Cancelando movimento...", "info");
      await axios.post(`http://localhost:3000/api/movimentos/${movimentoSelecionado.id}/cancelar`, {
        observacao
      });

      toast("✅ Movimento cancelado com sucesso!", "success");
      fecharModal();
      btnBuscar.click(); // Recarrega a lista
    } catch (err) {
      console.error("Erro ao cancelar movimento:", err);
      toast("❌ Falha ao cancelar movimento.", "error");
    }
  });

  // Inicializa
  limparTabela();
});
