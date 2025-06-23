// utils.js - completo, ajustado e pronto para o combate

// Consulta todos os status da API
async function consultarStatus() {
  try {
    const response = await axios.get('http://localhost:3000/api/status');
    return response.data;
  } catch (error) {
    console.error('Erro ao consultar status:', error);
    return [];
  }
}

// Consulta todas as espécies da API
async function consultarEspecies() {
  try {
    const response = await axios.get('http://localhost:3000/api/especies');
    return response.data;
  } catch (error) {
    console.error('Erro ao consultar espécies:', error);
    return [];
  }
}

// Consulta todas as raças com base na espécie
async function consultarRacasPorEspecie(especieId) {
  try {
    const response = await axios.get(`http://localhost:3000/api/racas?especieId=${especieId}`);
    return response.data;
  } catch (error) {
    console.error("Erro ao consultar raças por espécie:", error);
    return [];
  }
}

// Consulta todos os clientes da API
async function consultarClientes() {
  try {
    const response = await axios.get("http://localhost:3000/api/clientes");
    return response.data;
  } catch (error) {
    console.error("Erro ao consultar clientes:", error);
    return [];
  }
}
// Carrega os status no select com id "status"
async function carregarStatus() {
  const select = document.getElementById("status");
  if (!select) return;

  try {
    const statusList = await consultarStatus();
    select.innerHTML = "";

    statusList.forEach(status => {
      const option = document.createElement("option");
      option.value = status.id;
      option.textContent = status.descricao;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao carregar status:", error);
  }
}
// Carrega os status em um <select> com seletor passado por parâmetro
async function carregarStatusSelect(selectId) {
  const select = document.querySelector(selectId);
  if (!select) return;

  try {
    const statusList = await consultarStatus();
    select.innerHTML = "";

    statusList.forEach(status => {
      const option = document.createElement("option");
      option.value = status.id;
      option.textContent = status.descricao;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao carregar status no select:", error);
  }
}

// Carrega serviços em um select passando o seletor do select como argumento
async function carregarServicosSelect(selectId) {
  try {
    const response = await axios.get("http://localhost:3000/api/servicos");
    const select = document.querySelector(selectId);
    if (!select) return;

    select.innerHTML = "";

    response.data.forEach(servico => {
      const option = document.createElement("option");
      option.value = servico.id;
      option.textContent = servico.descricao;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao carregar serviços:", error);
  }
}

// Carrega as espécies no select com id "especie"
async function carregarEspecies() {
  const select = document.getElementById("especie");
  if (!select) return;

  try {
    const especies = await consultarEspecies();
    select.innerHTML = "";

    especies.forEach(especie => {
      const option = document.createElement("option");
      option.value = especie.id;
      option.textContent = especie.descricao;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao carregar espécies:", error);
  }
}

// Carrega as raças no select com id "raca" com base na espécie selecionada
async function carregarRacasPorEspecie(especieId) {
  const select = document.getElementById("raca");
  if (!select || !especieId) return;

  try {
    const racas = await consultarRacasPorEspecie(especieId);
    select.innerHTML = "";

    racas.forEach(raca => {
      const option = document.createElement("option");
      option.value = raca.id;
      option.textContent = raca.descricao;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao carregar raças:", error);
  }
}

// Carrega os clientes no select com id "cliente"
async function carregarClientes() {
  const select = document.getElementById("cliente");
  if (!select) return;

  try {
    const clientes = await consultarClientes();
    select.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Selecione um cliente...";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);

    clientes.forEach(cliente => {
      const option = document.createElement("option");
      option.value = cliente.id;
      option.textContent = cliente.nome;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao carregar clientes:", error);
  }
}

// Consulta todas as condições de pagamento
async function consultarCondicoesPagamento() {
  try {
    const response = await axios.get('http://localhost:3000/api/condicoes-de-pagamento');
    return response.data;
  } catch (error) {
    console.error('Erro ao consultar condições de pagamento:', error);
    return [];
  }
}

// Consulta todos os meios de pagamento
async function consultarMeiosPagamento() {
  try {
    const response = await axios.get('http://localhost:3000/api/meios-de-pagamento');
    return response.data;
  } catch (error) {
    console.error('Erro ao consultar meios de pagamento:', error);
    return [];
  }
}

// Carrega condições de pagamento em um select
async function carregarCondicoesPagamentoSelect(selectId) {
  const select = document.querySelector(selectId);
  if (!select) return;

  try {
    const condicoes = await consultarCondicoesPagamento();
    select.innerHTML = "";

    condicoes.forEach(condicao => {
      const option = document.createElement("option");
      option.value = condicao.id;
      option.textContent = condicao.descricao;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao carregar condições de pagamento:", error);
  }
}

// Carrega meios de pagamento em um select
async function carregarMeiosPagamentoSelect(selectId) {
  const select = document.querySelector(selectId);
  if (!select) return;

  try {
    const meios = await consultarMeiosPagamento();
    select.innerHTML = "";

    meios.forEach(meio => {
      const option = document.createElement("option");
      option.value = meio.id;
      option.textContent = meio.descricao;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao carregar meios de pagamento:", error);
  }
}

// Consulta pets por cliente
async function consultarPetsPorCliente(clienteId) {
  try {
    const response = await axios.get(`http://localhost:3000/api/pets?clienteId=${clienteId}`);
    return response.data;
  } catch (error) {
    console.error("Erro ao consultar pets do cliente:", error);
    return [];
  }
}

// Carrega pets no select com id "pet"
async function carregarPetsDoCliente(clienteId) {
  const select = document.getElementById("pet");
  if (!select || !clienteId) return;

  try {
    const pets = await consultarPetsPorCliente(clienteId);
    select.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Selecione um pet...";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);

    pets.forEach(pet => {
      const option = document.createElement("option");
      option.value = pet.id;
      option.textContent = pet.nome;
      option.dataset.racaId = pet.racaId;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao carregar pets do cliente:", error);
  }
}

// Consulta tabela de preços por petId
async function consultarTabelaDePrecosPorPet(petId) {
  try {
    const response = await axios.get(`http://localhost:3000/api/tabela-de-precos?petId=${petId}`);
    return response.data;
  } catch (error) {
    console.error("Erro ao consultar tabela de preços por pet:", error);
    return [];
  }
}

// Consulta tabela de preços por raça
async function consultarTabelaDePrecosPorRaca(racaId) {
  try {
    const response = await axios.get(`http://localhost:3000/api/tabela-de-precos?racaId=${racaId}`);
    return response.data;
  } catch (error) {
    console.error("Erro ao consultar tabela de preços por raça:", error);
    return [];
  }
}
// Configura o botão de mapa no formulário de clientes
function configurarBotaoMapa() {
  const btn = document.getElementById('btn-mapa');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const endereco = document.getElementById('endereco')?.value || '';
    const cidade = document.getElementById('cidade')?.value || '';
    const estado = document.getElementById('estado')?.value || '';
    const pais = document.getElementById('pais')?.value || '';
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${endereco}, ${cidade}, ${estado}, ${pais}`)}`;
    window.open(url, '_blank');
  });
}

// Configura o botão de adicionar novos campos de redes sociais
function configurarAdicaoRedeSocial() {
  const botao = document.getElementById('adicionar-rede');
  if (!botao) return;

  botao.addEventListener('click', () => {
    const div = document.createElement('div');
    div.innerHTML = '<input type="text" name="redeSocial[]" placeholder="https://..." />';
    document.getElementById('redes-sociais').appendChild(div);
  });
}
