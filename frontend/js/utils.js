// ==============================
// Consultas de dados via API
// ==============================

async function consultarStatus() {
  try {
    const response = await axios.get('http://localhost:3000/api/status');
    return response.data;
  } catch (error) {
    console.error('Erro ao consultar status:', error);
    return [];
  }
}

async function consultarEspecies() {
  try {
    const response = await axios.get('http://localhost:3000/api/especies');
    return response.data;
  } catch (error) {
    console.error('Erro ao consultar espécies:', error);
    return [];
  }
}

async function consultarRacasPorEspecie(especieId) {
  try {
    const response = await axios.get(`http://localhost:3000/api/racas?especieId=${especieId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao consultar raças por espécie:', error);
    return [];
  }
}

async function consultarClientes() {
  try {
    const response = await axios.get('http://localhost:3000/api/clientes');
    return response.data;
  } catch (error) {
    console.error('Erro ao consultar clientes:', error);
    return [];
  }
}

async function consultarCondicoesPagamento() {
  try {
    const response = await axios.get('http://localhost:3000/api/condicoes-de-pagamento');
    return response.data;
  } catch (error) {
    console.error('Erro ao consultar condições de pagamento:', error);
    return [];
  }
}

async function consultarMeiosPagamento() {
  try {
    const response = await axios.get('http://localhost:3000/api/meios-de-pagamento');
    return response.data;
  } catch (error) {
    console.error('Erro ao consultar meios de pagamento:', error);
    return [];
  }
}

async function consultarPetsPorCliente(clienteId) {
  try {
    const response = await axios.get(`http://localhost:3000/api/pets?clienteId=${clienteId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao consultar pets do cliente:', error);
    return [];
  }
}

async function consultarTabelaDePrecosPorPet(petId, servicoId = null) {
  try {
    console.log('[CONSULTA] Buscando tabela de preços por petId:', petId);
    const response = await axios.get(`http://localhost:3000/api/tabela-de-precos?petId=${petId}`);
    let tabela = response.data || [];

    if (servicoId) {
      tabela = tabela.filter(item => item.servicoId == servicoId);
    }

    console.log('[RESPOSTA] Dados da tabela de preços por pet:', tabela);
    return tabela;
  } catch (error) {
    console.error('Erro ao consultar tabela de preços por pet:', error);
    return [];
  }
}

async function consultarTabelaDePrecosPorRaca(racaId, servicoId = null) {
  try {
    console.log('[CONSULTA] Buscando tabela de preços por racaId:', racaId);
    const response = await axios.get(`http://localhost:3000/api/tabela-de-precos?racaId=${racaId}`);
    let tabela = response.data || [];

    if (servicoId) {
      tabela = tabela.filter(item => item.servicoId == servicoId);
    }

    console.log('[RESPOSTA] Dados da tabela de preços por raça:', tabela);
    return tabela;
  } catch (error) {
    console.error('Erro ao consultar tabela de preços por raça:', error);
    return [];
  }
}

// ==============================
// Carregamento de campos <select>
// ==============================

async function carregarStatusSelect(selectId) {
  const select = document.querySelector(selectId);
  if (!select) return;

  try {
    const statusList = await consultarStatus();
    select.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Selecione o status';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);

    statusList.forEach(status => {
      const option = document.createElement('option');
      option.value = status.id;
      option.textContent = status.descricao;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Erro ao carregar status no select:', error);
  }
}

async function carregarServicosSelect(selectId) {
  const select = document.querySelector(selectId);
  if (!select) return;

  try {
    const response = await axios.get('http://localhost:3000/api/servicos');
    select.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Selecione o serviço';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);

    response.data.forEach(servico => {
      const option = document.createElement('option');
      option.value = servico.id;
      option.textContent = servico.descricao;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Erro ao carregar serviços:', error);
  }
}

async function carregarCondicoesPagamentoSelect(selectId) {
  const select = document.querySelector(selectId);
  if (!select) return;

  try {
    const condicoes = await consultarCondicoesPagamento();
    select.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Selecione a condição de pagamento';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);

    condicoes.forEach(condicao => {
      const option = document.createElement('option');
      option.value = condicao.id;
      option.textContent = condicao.descricao;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Erro ao carregar condições de pagamento:', error);
  }
}

async function carregarMeiosPagamentoSelect(selectId) {
  const select = document.querySelector(selectId);
  if (!select) return;

  try {
    const meios = await consultarMeiosPagamento();
    select.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Selecione o meio de pagamento';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);

    meios.forEach(meio => {
      const option = document.createElement('option');
      option.value = meio.id;
      option.textContent = meio.descricao;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Erro ao carregar meios de pagamento:', error);
  }
}

async function carregarClientes() {
  const select = document.getElementById('cliente');
  if (!select) return;

  try {
    const clientes = await consultarClientes();
    select.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Selecione um cliente...';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);

    clientes.forEach(cliente => {
      const option = document.createElement('option');
      option.value = cliente.id;
      option.textContent = cliente.nome;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Erro ao carregar clientes:', error);
  }
}

async function carregarPetsDoCliente(clienteId) {
  const select = document.getElementById('pet');
  if (!select || !clienteId) return;

  try {
    const pets = await consultarPetsPorCliente(clienteId);
    select.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Selecione um pet...';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);

    pets.forEach(pet => {
      const option = document.createElement('option');
      option.value = pet.id;
      option.textContent = pet.nome;
      option.dataset.racaId = pet.racaId;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Erro ao carregar pets do cliente:', error);
  }
}

// ==============================
// Extras (clientes)
// ==============================

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

function configurarAdicaoRedeSocial() {
  const botao = document.getElementById('adicionar-rede');
  if (!botao) return;

  botao.addEventListener('click', () => {
    const div = document.createElement('div');
    div.innerHTML = '<input type="text" name="redeSocial[]" placeholder="https://..." />';
    document.getElementById('redes-sociais').appendChild(div);
  });
}

async function carregarEspeciesSelect(selectId) {
  const select = document.querySelector(selectId);
  if (!select) return;

  try {
    const especies = await consultarEspecies();
    select.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Selecione a espécie';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);

    especies.forEach(especie => {
      const option = document.createElement('option');
      option.value = especie.id;
      option.textContent = especie.descricao;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Erro ao carregar espécies:', error);
  }
}
async function carregarRacasPorEspecie(especieId) {
  const select = document.getElementById("raca");
  if (!select || !especieId) return;

  try {
    const racas = await consultarRacasPorEspecie(especieId);
    select.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Selecione uma raça";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);

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

// Expor carregarRacasPorEspecie globalmente
window.carregarRacasPorEspecie = carregarRacasPorEspecie;
