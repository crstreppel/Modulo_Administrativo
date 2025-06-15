document.addEventListener("DOMContentLoaded", async () => {
  await carregarClientes();
  await carregarStatusSelect("#status");
  await carregarCondicoesPagamentoSelect("#condicaoPagamento");
  await carregarMeiosPagamentoSelect("#meioPagamento");
  await carregarServicosSelect("#servico");

  const clienteSelect = document.getElementById("cliente");
  const petSelect = document.getElementById("pet");
  const tabelaContainer = document.getElementById("tabela-precos");

  // Ao selecionar cliente, carrega pets do cliente
  clienteSelect.addEventListener("change", async () => {
    const clienteId = clienteSelect.value;
    if (!clienteId) return;
    console.log("Cliente selecionado:", clienteId);
    await carregarPetsDoCliente(clienteId);
    tabelaContainer.innerHTML = "";
  });

  // Ao selecionar pet, busca tabela de preços
  petSelect.addEventListener("change", async () => {
    const petId = petSelect.value;
    const racaId = petSelect.selectedOptions[0]?.dataset.racaId;
    if (!petId) return;

    tabelaContainer.innerHTML = "<p>Carregando tabela de preços...</p>";

    let tabela = await consultarTabelaDePrecosPorPet(petId);

    if (!tabela || tabela.length === 0) {
      console.log("Nenhuma tabela por pet. Buscando por raça:", racaId);
      tabela = await consultarTabelaDePrecosPorRaca(racaId);
    }

    if (!tabela || tabela.length === 0) {
      tabelaContainer.innerHTML = "<p>Nenhuma tabela de preços disponível para este pet.</p>";
      return;
    }

    tabelaContainer.innerHTML = "";
    const ul = document.createElement("ul");
    tabela.forEach(item => {
      const li = document.createElement("li");
      li.textContent = `${item.servicoDescricao} - R$ ${item.preco.toFixed(2)}`;
      ul.appendChild(li);
    });
    tabelaContainer.appendChild(ul);
  });
});

async function carregarPetsDoCliente(clienteId) {
  const petSelect = document.getElementById("pet");
  if (!petSelect || !clienteId) return;

  try {
    const response = await axios.get(`http://localhost:3000/api/pets?clienteId=${clienteId}`);
    const pets = response.data;

    petSelect.innerHTML = "";
    if (pets.length === 0) {
      const option = document.createElement("option");
      option.textContent = "Nenhum pet encontrado";
      option.disabled = true;
      option.selected = true;
      petSelect.appendChild(option);
      petSelect.disabled = true;
      return;
    }

    const defaultOption = document.createElement("option");
    defaultOption.textContent = "Selecione um pet";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    petSelect.appendChild(defaultOption);

    pets.forEach(pet => {
      const option = document.createElement("option");
      option.value = pet.id;
      option.textContent = pet.nome;
      option.dataset.racaId = pet.racaId;
      petSelect.appendChild(option);
    });

    petSelect.disabled = false;
  } catch (error) {
    console.error("Erro ao carregar pets do cliente:", error);
    petSelect.innerHTML = "";
    petSelect.disabled = true;
  }
}
