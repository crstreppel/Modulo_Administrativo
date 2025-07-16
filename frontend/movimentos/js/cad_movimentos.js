document.addEventListener("DOMContentLoaded", async () => {
  await carregarClientes();
  await carregarStatusSelect("#status");
  await carregarCondicoesPagamentoSelect("#condicaoPagamento");
  await carregarMeiosPagamentoSelect("#meioPagamento");
  await carregarServicosSelect("#servico");

  const dataLancamentoInput = document.getElementById("data_lancamento");
  if (dataLancamentoInput && !dataLancamentoInput.value) {
    dataLancamentoInput.value = new Date().toISOString().split("T")[0];
  }

  const clienteSelect = document.getElementById("cliente");
  const petSelect = document.getElementById("pet");
  const servicoSelect = document.getElementById("servico");
  const tabelaSelect = document.getElementById("tabelaDePrecos");
  const valorInput = document.getElementById("valor");
  const tabelaDePrecosIdInput = document.getElementById("tabelaDePrecosId");
  const condicaoPagamentoSelect = document.getElementById("condicaoPagamento");
  const meioPagamentoSelect = document.getElementById("meioPagamento");
  const statusSelect = document.getElementById("status");

  const modal = document.getElementById("modal-confirmacao");
  const modalContent = modal.querySelector(".modal-content");

  let dadosPendentes = null;
  let racaIdDoPetSelecionado = null;
  let tabelaDePrecosCompleta = [];

  condicaoPagamentoSelect.addEventListener("change", () => {
    const condicao = condicaoPagamentoSelect.value;

    if (condicao === "1" || condicao === "3") {
      meioPagamentoSelect.disabled = false;
      statusSelect.value = "5";
    } else {
      meioPagamentoSelect.disabled = true;
      meioPagamentoSelect.value = "";
      statusSelect.value = "1";
    }
  });

  clienteSelect.addEventListener("change", async () => {
    const clienteId = clienteSelect.value;

    if (!clienteId) {
      petSelect.innerHTML = '<option value="">Selecione um cliente primeiro</option>';
      petSelect.disabled = true;
      resetTabelaPrecos();
      return;
    }

    await carregarPetsDoCliente(clienteId);
    petSelect.disabled = false;
    resetTabelaPrecos();
  });

  petSelect.addEventListener("change", atualizarSelectTabelaDePrecos);
  servicoSelect.addEventListener("change", atualizarSelectTabelaDePrecos);

  async function atualizarSelectTabelaDePrecos() {
    const petId = petSelect.value;
    const servicoId = servicoSelect.value;
    const selectedPet = petSelect.options[petSelect.selectedIndex];
    const racaId = selectedPet?.dataset?.racaId || null;
    racaIdDoPetSelecionado = racaId;

    tabelaSelect.innerHTML = `<option value="">Carregando...</option>`;
    tabelaSelect.disabled = true;
    valorInput.value = "";
    tabelaDePrecosIdInput.value = "";

    if (!petId || !servicoId) {
      tabelaSelect.innerHTML = `<option value="">Selecione um pet e serviço primeiro</option>`;
      return;
    }

    let tabela = await consultarTabelaDePrecosPorPet(petId, servicoId);
    if (!tabela.length && racaId) {
      tabela = await consultarTabelaDePrecosPorRaca(racaId, servicoId);
    }

    if (!tabela.length) {
      tabelaSelect.innerHTML = `<option value="">Nenhuma entrada encontrada</option>`;
      return;
    }

    tabelaDePrecosCompleta = tabela;

    tabelaSelect.innerHTML = `<option value="">Selecione uma entrada</option>`;
    tabela.forEach(item => {
      const preco = parseFloat(item.valorServico || item.preco || 0);
      const descricao = item.servico?.descricao || "Sem descrição";

      if (!isNaN(preco)) {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = `R$ ${preco.toFixed(2)} - ${descricao}`;
        option.dataset.preco = preco;
        tabelaSelect.appendChild(option);
      }
    });

    tabelaSelect.disabled = false;
  }

  tabelaSelect.addEventListener("change", () => {
    const selected = tabelaSelect.selectedOptions[0];
    if (selected?.value) {
      valorInput.value = selected.dataset.preco;
      tabelaDePrecosIdInput.value = selected.value;

      const itemSelecionado = tabelaDePrecosCompleta.find(item => item.id == selected.value);
      if (itemSelecionado) {
        condicaoPagamentoSelect.value = itemSelecionado.condicaoDePagamentoId;
        meioPagamentoSelect.value = itemSelecionado.meioDePagamentoId;

        if (itemSelecionado.condicaoDePagamentoId === 1 || itemSelecionado.condicaoDePagamentoId === 3) {
          meioPagamentoSelect.disabled = false;
          statusSelect.value = "5";
        } else {
          meioPagamentoSelect.disabled = true;
          meioPagamentoSelect.value = "";
          statusSelect.value = "1";
        }
      }
    } else {
      valorInput.value = "";
      tabelaDePrecosIdInput.value = "";
    }
  });

  function resetTabelaPrecos() {
    tabelaSelect.innerHTML = `<option value="">Selecione um pet e serviço primeiro</option>`;
    tabelaSelect.disabled = true;
    valorInput.value = "";
    tabelaDePrecosIdInput.value = "";
  }

  const form = document.getElementById("formCadastroMovimento");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const hoje = new Date();
    const dataAtual = hoje.toISOString().split("T")[0];
    const condicaoPagamentoId = condicaoPagamentoSelect.value;
    let data_vencimento = dataLancamentoInput.value;

    if (condicaoPagamentoId === "2") {
      const venc = new Date(data_vencimento);
      venc.setMonth(venc.getMonth() + 1);
      venc.setDate(10);
      data_vencimento = venc.toISOString().split("T")[0];
    }

    const dados = {
      data_lancamento: dataLancamentoInput.value,
      data_movimento: dataAtual,
      clienteId: clienteSelect.value,
      petId: petSelect.value,
      servicoId: servicoSelect.value,
      valor: parseFloat(valorInput.value) || 0,
      condicaoPagamentoId,
      meioPagamentoId: meioPagamentoSelect.value,
      statusId: statusSelect.value,
      data_vencimento,
      tabelaDePrecosId: tabelaDePrecosIdInput.value || null,
    };

    try {
      const resposta = await axios.get("http://localhost:3000/api/tabela-de-precos/verificar", {
        params: {
          petId: dados.petId,
          condicaoDePagamentoId: dados.condicaoPagamentoId,
          meioDePagamentoId: dados.meioPagamentoId
        }
      });

      if (resposta.data.existe) {
        await enviarMovimento(dados);
      } else {
        dadosPendentes = dados;
        abrirModalConfirmacao();
      }
    } catch (erro) {
      console.error("Erro ao verificar entrada na tabela de preços:", erro);
      alert("Erro ao verificar tabela de preços.");
    }
  });

  async function enviarMovimento(dados) {
    try {
      await axios.post("http://localhost:3000/api/movimentos", dados);
      alert("Movimento salvo com sucesso!");
      form.reset();
      petSelect.disabled = true;
      resetTabelaPrecos();
    } catch (error) {
      console.error("Erro ao salvar movimento:", error);
      alert("Erro ao salvar movimento.");
    }
  }

  function abrirModalConfirmacao() {
    modal.style.display = "flex";

    modalContent.innerHTML = `
      <p>Não existe entrada na tabela de preços com os dados informados.</p>
      <p>Deseja criar uma nova entrada?</p>
      <button id="criarParaPet" class="confirm-btn">Criar para o PET</button>
      <button id="criarParaRaca" class="confirm-btn">Criar para a RAÇA</button>
      <button id="cancelarCriacao" class="cancel-btn">Cancelar</button>
    `;

    const btnPet = document.getElementById("criarParaPet");
    const btnRaca = document.getElementById("criarParaRaca");
    const btnCancelar = document.getElementById("cancelarCriacao");

    btnCancelar.addEventListener("click", () => {
      modal.style.display = "none";
      dadosPendentes = null;
    });

    btnPet.addEventListener("click", async () => {
      if (!dadosPendentes) return;
      try {
        await axios.post("http://localhost:3000/api/tabela-de-precos", {
          petId: dadosPendentes.petId,
          condicaoPagamentoId: dadosPendentes.condicaoPagamentoId,
          meioPagamentoId: dadosPendentes.meioPagamentoId,
          servicoId: dadosPendentes.servicoId,
          valorServico: dadosPendentes.valor
        });
        modal.style.display = "none";
        await enviarMovimento(dadosPendentes);
      } catch (erro) {
        console.error("Erro ao criar entrada para o pet:", erro);
        alert("Erro ao criar entrada.");
      }
    });

    btnRaca.addEventListener("click", async () => {
      if (!dadosPendentes || !racaIdDoPetSelecionado) return;
      try {
        await axios.post("http://localhost:3000/api/tabela-de-precos", {
          racaId: racaIdDoPetSelecionado,
          condicaoPagamentoId: dadosPendentes.condicaoPagamentoId,
          meioPagamentoId: dadosPendentes.meioPagamentoId,
          servicoId: dadosPendentes.servicoId,
          valorServico: dadosPendentes.valor
        });
        modal.style.display = "none";
        await enviarMovimento(dadosPendentes);
      } catch (erro) {
        console.error("Erro ao criar entrada para a raça:", erro);
        alert("Erro ao criar entrada.");
      }
    });
  }
});
