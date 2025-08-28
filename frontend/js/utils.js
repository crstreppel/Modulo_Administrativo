// ==============================
// utils.js  —  Padrão Bruxão
// Central de helpers HTTP + preenchimento de <select>
// ==============================

/**
 * Base da API (pode sobrescrever via window.API_BASE_URL antes de carregar este arquivo)
 */
const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000/api';

// -----------------------------------------------------
// Helpers internos
// -----------------------------------------------------
function _safeLog(...args) {
  try { console.log(...args); } catch (_) {}
}

function _fillSelect(selectEl, items, labelProp, placeholder) {
  if (!selectEl) return;
  selectEl.innerHTML = '';

  const def = document.createElement('option');
  def.value = '';
  def.textContent = placeholder || 'Selecione...';
  def.disabled = true;
  def.selected = true;
  selectEl.appendChild(def);

  if (!Array.isArray(items)) return;

  items.forEach(it => {
    const opt = document.createElement('option');
    opt.value = it.id;
    opt.textContent = (it?.[labelProp] ?? `ID: ${it?.id ?? ''}`);
    selectEl.appendChild(opt);
  });
}

// -----------------------------------------------------
// Consultas de dados via API
// -----------------------------------------------------
async function consultarStatus() {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/status`);
    return data || [];
  } catch (error) {
    console.error('Erro ao consultar status:', error);
    return [];
  }
}

async function consultarEspecies() {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/especies`);
    return data || [];
  } catch (error) {
    console.error('Erro ao consultar espécies:', error);
    return [];
  }
}

async function consultarRacasPorEspecie(especieId) {
  if (!especieId) return [];
  try {
    const { data } = await axios.get(`${API_BASE_URL}/racas`, { params: { especieId } });
    return data || [];
  } catch (error) {
    console.error('Erro ao consultar raças por espécie:', error);
    return [];
  }
}

async function consultarClientes() {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/clientes`);
    return data || [];
  } catch (error) {
    console.error('Erro ao consultar clientes:', error);
    return [];
  }
}

async function consultarCondicoesPagamento() {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/condicoes-de-pagamento`);
    return data || [];
  } catch (error) {
    console.error('Erro ao consultar condições de pagamento:', error);
    return [];
  }
}

async function consultarMeiosPagamento() {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/meios-de-pagamento`);
    return data || [];
  } catch (error) {
    console.error('Erro ao consultar meios de pagamento:', error);
    return [];
  }
}

async function consultarPetsPorCliente(clienteId) {
  if (!clienteId) return [];
  try {
    const { data } = await axios.get(`${API_BASE_URL}/pets`, { params: { clienteId } });
    return data || [];
  } catch (error) {
    console.error('Erro ao consultar pets do cliente:', error);
    return [];
  }
}

/**
 * Tabela de Preços por PET (opcional filtra por servicoId)
 */
async function consultarTabelaDePrecosPorPet(petId, servicoId = null) {
  if (!petId) return [];
  try {
    _safeLog('[CONSULTA] Tabela por petId:', petId);
    const { data } = await axios.get(`${API_BASE_URL}/tabela-de-precos`, { params: { petId } });
    let tabela = data || [];
    if (servicoId) tabela = tabela.filter(it => String(it.servicoId) === String(servicoId));
    _safeLog('[RESPOSTA] Tabela por pet:', tabela);
    return tabela;
  } catch (error) {
    console.error('Erro ao consultar tabela de preços por pet:', error);
    return [];
  }
}

/**
 * Tabela de Preços por RAÇA (opcional filtra por servicoId)
 */
async function consultarTabelaDePrecosPorRaca(racaId, servicoId = null) {
  if (!racaId) return [];
  try {
    _safeLog('[CONSULTA] Tabela por racaId:', racaId);
    const { data } = await axios.get(`${API_BASE_URL}/tabela-de-precos`, { params: { racaId } });
    let tabela = data || [];
    if (servicoId) tabela = tabela.filter(it => String(it.servicoId) === String(servicoId));
    _safeLog('[RESPOSTA] Tabela por raça:', tabela);
    return tabela;
  } catch (error) {
    console.error('Erro ao consultar tabela de preços por raça:', error);
    return [];
  }
}

// -----------------------------------------------------
// Carregamento de campos <select>
// -----------------------------------------------------
async function carregarStatusSelect(selectId) {
  const select = document.querySelector(selectId);
  if (!select) return;

  try {
    const statusList = await consultarStatus();
    _fillSelect(select, statusList, 'descricao', 'Selecione o status');
  } catch (error) {
    console.error('Erro ao carregar status no select:', error);
  }
}

async function carregarServicosSelect(selectId) {
  const select = document.querySelector(selectId);
  if (!select) return;

  try {
    const { data } = await axios.get(`${API_BASE_URL}/servicos`);
    _fillSelect(select, data || [], 'descricao', 'Selecione o serviço');
  } catch (error) {
    console.error('Erro ao carregar serviços:', error);
  }
}

async function carregarCondicoesPagamentoSelect(selectId) {
  const select = document.querySelector(selectId);
  if (!select) return;

  try {
    const condicoes = await consultarCondicoesPagamento();
    _fillSelect(select, condicoes, 'descricao', 'Selecione a condição de pagamento');
  } catch (error) {
    console.error('Erro ao carregar condições de pagamento:', error);
  }
}

async function carregarMeiosPagamentoSelect(selectId) {
  const select = document.querySelector(selectId);
  if (!select) return;

  try {
    const meios = await consultarMeiosPagamento();
    _fillSelect(select, meios, 'descricao', 'Selecione o meio de pagamento');
  } catch (error) {
    console.error('Erro ao carregar meios de pagamento:', error);
  }
}

async function carregarClientes() {
  const select = document.getElementById('cliente');
  if (!select) return;

  try {
    const clientes = await consultarClientes();
    _fillSelect(select, clientes, 'nome', 'Selecione um cliente...');
  } catch (error) {
    console.error('Erro ao carregar clientes:', error);
  }
}

async function carregarPetsDoCliente(clienteId) {
  const select = document.getElementById('pet');
  if (!select || !clienteId) return;

  try {
    const pets = await consultarPetsPorCliente(clienteId);
    // Preenche e mantém racaId no dataset para usos futuros
    _fillSelect(select, pets, 'nome', 'Selecione um pet...');
    Array.from(select.options).forEach(opt => {
      if (!opt.value) return;
      const pet = pets.find(p => String(p.id) === String(opt.value));
      if (pet) opt.dataset.racaId = pet.racaId ?? '';
    });
  } catch (error) {
    console.error('Erro ao carregar pets do cliente:', error);
  }
}

async function carregarEspeciesSelect(selectId) {
  const select = document.querySelector(selectId);
  if (!select) return;

  try {
    const especies = await consultarEspecies();
    _fillSelect(select, especies, 'descricao', 'Selecione a espécie');
  } catch (error) {
    console.error('Erro ao carregar espécies:', error);
  }
}

async function carregarRacasPorEspecie(especieId) {
  const select = document.getElementById('raca');
  if (!select || !especieId) return;

  try {
    const racas = await consultarRacasPorEspecie(especieId);
    _fillSelect(select, racas, 'descricao', 'Selecione uma raça');
  } catch (error) {
    console.error('Erro ao carregar raças:', error);
  }
}

// -----------------------------------------------------
// Exposição global (evita problemas de escopo em páginas distintas)
// -----------------------------------------------------
Object.assign(window, {
  API_BASE_URL,

  // consultas
  consultarStatus,
  consultarEspecies,
  consultarRacasPorEspecie,
  consultarClientes,
  consultarCondicoesPagamento,
  consultarMeiosPagamento,
  consultarPetsPorCliente,
  consultarTabelaDePrecosPorPet,
  consultarTabelaDePrecosPorRaca,

  // carregadores de <select>
  carregarStatusSelect,
  carregarServicosSelect,
  carregarCondicoesPagamentoSelect,
  carregarMeiosPagamentoSelect,
  carregarClientes,
  carregarPetsDoCliente,carregarEspeciesSelect,carregarRacasPorEspecie,
});
