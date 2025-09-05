/**
 * SISTEMA PETSHOP - MÓDULO TABELA DE PREÇOS
 * Arquivo: cad_tabeladeprecos.js
 * Versão: 2.5
 * Mudanças vs 2.4:
 * - Filtro ESPECIE → RAÇAS com blindagem quando espécie não selecionada (limpa/desabilita raças)
 * - Placeholder e loading explícitos no select de raças
 * - Cache por especieId pra evitar re-fetch desnecessário
 * - Fallback de API_BASE_URL (usa location.origin + '/api' se não houver global)
 * - Pequenos reforços de validação e UX
 */

// ==================== CONSTANTES ====================
const API_BASE = (typeof API_BASE_URL !== 'undefined' && API_BASE_URL)
  ? API_BASE_URL.replace(/\/+$/, '')
  : `${location.origin}/api`;

const DEFAULT_ESPECIE_ID = 1; // Canina

// Selects genéricos (carregados em paralelo). RAÇAS ficam de fora porque dependem de ESPECIE.
const SELECT_CONFIG = [
  { id: 'servico', endpoint: 'servicos', prop: 'descricao' },
  { id: 'condicao-pagamento', endpoint: 'condicoes-de-pagamento', prop: 'descricao' },
  { id: 'pet', endpoint: 'pets', prop: 'nome' },
  { id: 'status', endpoint: 'status', prop: 'descricao' },
  // ESPECIE é suportado (se existir no HTML). RAÇAS são carregadas depois via especieId.
  { id: 'especie', endpoint: 'especies', prop: 'descricao' }
];

// Cache simples pra raças por especieId
const _racasCache = new Map();

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', init);

async function init() {
  console.log('🚀 Iniciando módulo de tabela de preços v2.5...');
  try {
    await loadAllSelects();
    await initEspecieRacaWorkflow(); // carrega raças conforme espécie
    setupForm();
    setupMutualExclusion();
  } catch (error) {
    console.error('💥 Erro na inicialização:', error);
    showError('Falha ao carregar a página. Recarregue e tente novamente.');
  }
}

// ==================== CARREGAMENTO DOS SELECTS ====================
async function loadAllSelects() {
  console.log('🔄 Carregando selects (exceto RAÇAS, que dependem de ESPÉCIE)...');

  const loadPromises = SELECT_CONFIG.map(config => loadSelect(config).catch(err => {
    console.warn(`⚠️ Select #${config.id} ignorado:`, err?.message || err);
    return null;
  }));
  await Promise.all(loadPromises);

  console.log('✅ Selects base carregados (ou ignorados se ausentes).');
}

/**
 * Carrega um select simples (sem filtros)
 */
async function loadSelect({ id, endpoint, prop }) {
  const select = document.getElementById(id);
  if (!select) {
    throw new Error(`Elemento #${id} não encontrado`);
  }

  try {
    const { data } = await axios.get(`${API_BASE}/${endpoint}`, { validateStatus: () => true });
    if (!Array.isArray(data)) throw new Error('Resposta inesperada da API');

    select.innerHTML = `<option value="">Selecione...</option>`;
    data.forEach(item => {
      const option = new Option(item?.[prop] || `ID: ${item.id}`, item.id);
      select.add(option);
    });
  } catch (error) {
    select.innerHTML = `<option value="">Erro ao carregar</option>`;
    throw error;
  }
}

/**
 * Inicializa o vínculo ESPECIE → RAÇAS:
 * - Define especie default = 1 (Canina) se existir no select
 * - Carrega RAÇAS filtradas por especieId
 * - Escuta mudanças de ESPECIE para recarregar RAÇAS
 * - Se não houver select de ESPECIE, faz fallback: carrega RAÇAS sem filtro
 */
async function initEspecieRacaWorkflow() {
  const especieSelect = document.getElementById('especie');
  const racaSelect = document.getElementById('raca');

  if (!racaSelect) {
    console.warn('⚠️ Select #raca não encontrado — pulando vínculo ESPECIE→RAÇAS.');
    return;
  }

  if (!especieSelect) {
    console.warn('⚠️ Select #especie não encontrado — carregando raças sem filtro.');
    await loadRacasSemFiltro();
    return;
  }

  // Pré-seleciona default se existir
  const hasDefault = Array.from(especieSelect.options).some(opt => String(opt.value) === String(DEFAULT_ESPECIE_ID));
  if (hasDefault && !especieSelect.value) {
    especieSelect.value = String(DEFAULT_ESPECIE_ID);
  }

  // Estado inicial
  const especieInicial = especieSelect.value || '';
  if (especieInicial) {
    await loadRacasByEspecie(especieInicial);
    racaSelect.disabled = false;
  } else {
    clearRacaWithPlaceholder('Selecione a espécie primeiro');
    racaSelect.disabled = true;
  }

  // Evento: ao mudar ESPECIE, recarregar RAÇAS
  especieSelect.addEventListener('change', async () => {
    const selected = especieSelect.value || '';
    if (!selected) {
      clearRacaWithPlaceholder('Selecione a espécie primeiro');
      racaSelect.disabled = true;
      return;
    }
    await loadRacasByEspecie(selected);
    if (!document.getElementById('pet')?.disabled) {
      racaSelect.disabled = false;
    }
  });
}

function clearRacaWithPlaceholder(placeholder = 'Selecione...') {
  const racaSelect = document.getElementById('raca');
  if (!racaSelect) return;
  racaSelect.innerHTML = `<option value="">${placeholder}</option>`;
}

async function loadRacasByEspecie(especieId) {
  const racaSelect = document.getElementById('raca');
  if (!racaSelect) return;

  const id = String(especieId || '').trim();
  if (!id) {
    clearRacaWithPlaceholder('Selecione a espécie primeiro');
    racaSelect.disabled = true;
    return;
  }

  // Cache hit?
  if (_racasCache.has(id)) {
    applyRacasToSelect(_racasCache.get(id));
    return;
  }

  try {
    racaSelect.disabled = true;
    racaSelect.innerHTML = `<option value="">Carregando...</option>`;

    const { data } = await axios.get(`${API_BASE}/racas`, {
      params: { especieId: id },
      validateStatus: () => true
    });

    if (!Array.isArray(data)) throw new Error('Resposta inesperada ao listar raças');

    _racasCache.set(id, data);
    applyRacasToSelect(data);
  } catch (error) {
    console.error('Erro ao carregar raças por espécie:', error);
    racaSelect.innerHTML = `<option value="">Erro ao carregar</option>`;
  } finally {
    // só habilita se não houver conflito com o select de pet
    if (!document.getElementById('pet')?.disabled) {
      racaSelect.disabled = false;
    }
  }
}

function applyRacasToSelect(racasArray) {
  const racaSelect = document.getElementById('raca');
  if (!racaSelect) return;

  racaSelect.innerHTML = `<option value="">Selecione...</option>`;
  if (!racasArray || racasArray.length === 0) {
    racaSelect.innerHTML = `<option value="">Nenhuma raça para esta espécie</option>`;
    return;
  }

  const frag = document.createDocumentFragment();
  racasArray.forEach(item => {
    const option = new Option(item?.descricao || `ID: ${item.id}`, item.id);
    frag.appendChild(option);
  });
  racaSelect.appendChild(frag);
}

async function loadRacasSemFiltro() {
  const racaSelect = document.getElementById('raca');
  if (!racaSelect) return;

  try {
    racaSelect.disabled = true;
    racaSelect.innerHTML = `<option value="">Carregando...</option>`;
    const { data } = await axios.get(`${API_BASE}/racas`, { validateStatus: () => true });
    if (!Array.isArray(data)) throw new Error('Resposta inesperada ao listar raças');

    racaSelect.innerHTML = `<option value="">Selecione...</option>`;
    data.forEach(item => {
      const option = new Option(item?.descricao || `ID: ${item.id}`, item.id);
      racaSelect.add(option);
    });
  } catch (error) {
    console.error('Erro ao carregar raças (sem filtro):', error);
    racaSelect.innerHTML = `<option value="">Erro ao carregar</option>`;
  } finally {
    if (!document.getElementById('pet')?.disabled) {
      racaSelect.disabled = false;
    }
  }
}

// ==================== EXCLUSÃO MÚTUA ====================
function setupMutualExclusion() {
  const racaSelect = document.getElementById('raca');
  const petSelect = document.getElementById('pet');
  if (!racaSelect || !petSelect) return;

  racaSelect.addEventListener('change', () => {
    if (racaSelect.value) {
      petSelect.disabled = true;
      petSelect.value = "";
    } else {
      petSelect.disabled = false;
    }
  });

  petSelect.addEventListener('change', () => {
    if (petSelect.value) {
      racaSelect.disabled = true;
      racaSelect.value = "";
    } else {
      racaSelect.disabled = false;
    }
  });
}

// ==================== MANIPULAÇÃO DO FORMULÁRIO ====================
function setupForm() {
  const form = document.getElementById('form-tabela-precos');
  if (!form) throw new Error('Formulário não encontrado');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleFormSubmit(e.target);
  });
}

async function handleFormSubmit(form) {
  const formData = getFormData(form);

  if (!validateFormData(formData)) {
    return showError('Preencha todos os campos corretamente! Um dos campos "Raça" ou "Pet" deve estar selecionado.');
  }

  try {
    showLoading();
    const { data } = await axios.post(`${API_BASE}/tabela-de-precos`, formData, { validateStatus: () => true });
    showSuccess(data);
    form.reset();

    // Reabilitar selects após reset
    const raca = document.getElementById('raca');
    const pet = document.getElementById('pet');
    if (raca) raca.disabled = false;
    if (pet) pet.disabled = false;

    // Reaplicar default da espécie e recarregar raças filtradas
    const especie = document.getElementById('especie');
    if (especie) {
      const hasDefault = Array.from(especie.options).some(opt => String(opt.value) === String(DEFAULT_ESPECIE_ID));
      if (hasDefault) especie.value = String(DEFAULT_ESPECIE_ID);
      await loadRacasByEspecie(especie?.value || DEFAULT_ESPECIE_ID);
    } else {
      await loadRacasSemFiltro();
    }
  } catch (error) {
    showError(error);
  } finally {
    hideLoading();
  }
}

function getFormData(form) {
  const get = (name) => form?.[name];
  const toInt = (v) => {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : NaN;
  };
  const toFloat = (v) => {
    const n = Number.parseFloat(String(v ?? '').replace(',', '.'));
    return Number.isFinite(n) ? n : NaN;
  };

  const racaField = get('raca');
  const petField = get('pet');
  const especieField = get('especie');

  const racaId = racaField?.value ? toInt(racaField.value) : NaN;
  const petId = petField?.value ? toInt(petField.value) : NaN;
  const especieIdRaw = especieField?.value ? toInt(especieField.value) : NaN;

  const payload = {
    servicoId: toInt(get('servico')?.value),
    condicaoDePagamentoId: toInt(get('condicao-pagamento')?.value),
    // meioDePagamentoId: REMOVIDO
    racaId,
    petId,
    valorServico: toFloat(get('valor-servico')?.value),
    statusId: toInt(get('status')?.value),
  };

  if (Number.isFinite(especieIdRaw)) {
    payload.especieId = especieIdRaw;
  }

  return payload;
}

function validateFormData(data) {
  const obrigatorios = [
    data.servicoId,
    data.condicaoDePagamentoId,
    data.valorServico,
    data.statusId
  ];
  const xor = (!isNaN(data.racaId) ? 1 : 0) + (!isNaN(data.petId) ? 1 : 0);
  const obrigatoriosOk = obrigatorios.every(v => Number.isFinite(v));
  const valorOk = Number.isFinite(data.valorServico) && data.valorServico > 0;
  return obrigatoriosOk && valorOk && xor === 1;
}

// ==================== FEEDBACK VISUAL ====================
function showLoading() {
  const btnSubmit = document.querySelector('#form-tabela-precos button[type="submit"]');
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Salvando...';
  }
}

function hideLoading() {
  const btnSubmit = document.querySelector('#form-tabela-precos button[type="submit"]');
  if (btnSubmit) {
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Cadastrar';
  }
}

function showSuccess(data) {
  const divCadastro = document.getElementById('tabela-cadastrada');
  if (!divCadastro) return;

  const valorFormatado = formatCurrency(data?.valorServico ?? data?.valor ?? 0);
  divCadastro.innerHTML = `
    <div class="alert success">
      <h3><i class="fa fa-check-circle"></i> Registro cadastrado!</h3>
      <p><strong>Serviço:</strong> ${data?.servico?.descricao || 'N/A'}</p>
      <p><strong>Condição:</strong> ${data?.condicaoDePagamento?.descricao || data?.condicaoDePagamentoId || 'N/A'}</p>
      <p><strong>Vinculado a:</strong> ${
        data?.pet ? `Pet: ${data.pet?.nome}` :
        data?.raca ? `Raça: ${data.raca?.descricao}` :
        'N/A'
      }</p>
      <p><strong>Valor:</strong> ${valorFormatado}</p>
      <div class="actions">
        <button class="btn btn-edit" onclick="editarRegistro(${data?.id})">
          <i class="fa fa-edit"></i> Editar
        </button>
        <button class="btn btn-delete" onclick="excluirRegistro(${data?.id})">
          <i class="fa fa-trash"></i> Excluir
        </button>
      </div>
    </div>
  `;
}

function showError(error) {
  console.error('Erro detalhado:', error);
  const errorMessage = getErrorMessage(error);
  const divCadastro = document.getElementById('tabela-cadastrada');

  if (divCadastro) {
    divCadastro.innerHTML = `
      <div class="alert error">
        <h3><i class="fa fa-exclamation-circle"></i> Erro!</h3>
        <p>${errorMessage}</p>
      </div>
    `;
  }
  alert(errorMessage); // fallback
}

// ==================== UTILITÁRIOS ====================
function formatCurrency(value) {
  const num = parseFloat(value) || 0;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getErrorMessage(error) {
  if (typeof error === 'string') return error;
  if (error?.response?.data) {
    return error.response.data.erro ||
           error.response.data.message ||
           'Erro no servidor. Tente novamente.';
  }
  return error?.message || 'Erro desconhecido';
}

// ==================== FUNÇÕES GLOBAIS ====================
window.editarRegistro = (id) => {
  console.log('Editando registro:', id);
  alert('Fluxo de edição ainda não implementado.');
};

window.excluirRegistro = async (id) => {
  if (!confirm('Tem certeza que deseja excluir este registro?')) return;
  try {
    showLoading();
    await axios.delete(`${API_BASE}/tabela-de-precos/${id}`, { validateStatus: () => true });
    hideLoading();

    const divCadastro = document.getElementById('tabela-cadastrada');
    if (divCadastro) {
      divCadastro.innerHTML = `
        <div class="alert success">
          <h3><i class="fa fa-check-circle"></i> Registro excluído!</h3>
          <p>O item #${id} foi removido com sucesso.</p>
        </div>
      `;
    }
  } catch (error) {
    hideLoading();
    showError(error);
  }
};
