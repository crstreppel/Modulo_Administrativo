document.addEventListener("DOMContentLoaded", async () => {
  await carregarClientes();
  await carregarStatusSelect("#status");
  await carregarCondicoesPagamentoSelect("#condicaoPagamento");
  await carregarMeiosPagamentoSelect("#meioPagamento");
  await carregarServicosSelect("#servico");

  const clienteSelect = document.getElementById("cliente");
  const petSelect = document.getElementById("pet");
  const servicoSelect = document.getElementById("servico");
  const tabelaSelect = document.getElementById("tabelaDePrecos");
  const valorInput = document.getElementById("valor");
  const tabelaDePrecosIdInput = document.getElementById("tabelaDePrecosId");

  clienteSelect.addEventListener("change", async () => {
    const clienteId = clienteSelect.value;
    if (!clienteId) {
      petSelect.innerHTML = '<option value="">Selecione um cliente primeiro</option>';
      petSelect.disabled = true;
      tabelaSelect.innerHTML = `<option value="">Selecione um pet e serviço primeiro</option>`;
      tabelaSelect.disabled = true;
      valorInput.value = "";
      tabelaDePrecosIdInput.value = "";
      return;
    }
    await carregarPetsDoCliente(clienteId);
    petSelect.disabled = false;
    tabelaSelect.innerHTML = `<option value="">Selecione um pet e serviço primeiro</option>`;
    tabelaSelect.disabled = true;
    valorInput.value = "";
    tabelaDePrecosIdInput.value = "";
  });

  petSelect.addEventListener("change", async () => {
    await atualizarSelectTabelaDePrecos();
  });

  servicoSelect.addEventListener("change", async () => {
    await atualizarSelectTabelaDePrecos();
  });

  async function atualizarSelectTabelaDePrecos() {
    const petId = petSelect.value;
    const servicoId = servicoSelect.value;
    const selectedPet = petSelect.options[petSelect.selectedIndex];
    const racaId = selectedPet ? selectedPet.dataset.racaId : null;

    tabelaSelect.innerHTML = `<option value="">Carregando...</option>`;
    tabelaSelect.disabled = true;
    valorInput.value = "";
    tabelaDePrecosIdInput.value = "";

    if (!petId || !servicoId) {
      tabelaSelect.innerHTML = `<option value="">Selecione um pet e serviço primeiro</option>`;
      return;
    }

    let tabela = await consultarTabelaDePrecosPorPet(petId);
    if (!tabela || tabela.length === 0) {
      tabela = await consultarTabelaDePrecosPorRaca(racaId);
    }

    if (!tabela || tabela.length === 0) {
      tabelaSelect.innerHTML = `<option value="">Nenhuma entrada encontrada</option>`;
      return;
    }

    const tabelaComPreco = tabela.map(item => ({
      ...item,
      preco: parseFloat(item.valorServico || item.preco || 0),
      servicoDescricao: item.servicoDescricao || "Sem descrição"
    }));

    const opcoesFiltradas = tabelaComPreco.filter(item => item.servicoId == servicoId && !isNaN(item.preco));

    if (opcoesFiltradas.length === 0) {
      tabelaSelect.innerHTML = `<option value="">Nenhuma entrada para este serviço</option>`;
      return;
    }

    tabelaSelect.innerHTML = `<option value="">Selecione uma entrada</option>`;
    opcoesFiltradas.forEach(item => {
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = `R$ ${item.preco.toFixed(2)} - ${item.servicoDescricao}`;
      option.dataset.preco = item.preco;
      tabelaSelect.appendChild(option);
    });

    tabelaSelect.disabled = false;
  }

  tabelaSelect.addEventListener("change", () => {
    const selected = tabelaSelect.selectedOptions[0];
    if (selected && selected.value) {
      const preco = selected.dataset.preco;
      valorInput.value = preco;
      tabelaDePrecosIdInput.value = selected.value;
    } else {
      valorInput.value = "";
      tabelaDePrecosIdInput.value = "";
    }
  });

  const form = document.getElementById("formCadastroMovimento");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const hoje = new Date();
    const dataAtual = hoje.toISOString().split("T")[0];
    const condicaoPagamentoId = document.getElementById("condicaoPagamento").value;
    let data_vencimento = document.getElementById("data_lancamento").value;

    if (condicaoPagamentoId === "2") {
      const venc = new Date(data_vencimento);
      venc.setMonth(venc.getMonth() + 1);
      venc.setDate(10);
      data_vencimento = venc.toISOString().split("T")[0];
    }

    const dados = {
      data_lancamento: document.getElementById("data_lancamento").value,
      data_movimento: dataAtual,
      clienteId: clienteSelect.value,
      petId: petSelect.value,
      servicoId: servicoSelect.value,
      valor: parseFloat(valorInput.value) || 0,
      condicaoPagamentoId,
      meioPagamentoId: document.getElementById("meioPagamento").value,
      statusId: document.getElementById("status").value,
      data_vencimento,
      tabelaDePrecosId: tabelaDePrecosIdInput.value || null
    };

    console.log("Dados para envio:", dados);

    try {
      await axios.post("http://localhost:3000/api/movimentos", dados);
      alert("Movimento salvo com sucesso!");
      form.reset();
      petSelect.disabled = true;
      tabelaSelect.innerHTML = `<option value="">Selecione um pet e serviço primeiro</option>`;
      tabelaSelect.disabled = true;
      valorInput.value = "";
      tabelaDePrecosIdInput.value = "";
    } catch (error) {
      console.error("Erro ao salvar movimento:", error);
      alert("Erro ao salvar movimento.");
    }
  });
});
