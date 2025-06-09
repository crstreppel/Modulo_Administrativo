/**
 * SISTEMA PETSHOP - MÓDULO TABELA DE PREÇOS
 * Arquivo: cad_tabeladeprecos.js
 * Versão: 2.1
 * Autor: Claudio, o Fullstack Jedi
 */

// ==================== CONSTANTES ====================
const API_BASE_URL = 'http://localhost:3000/api';
const SELECT_CONFIG = [
  { id: 'servico', endpoint: 'servicos', prop: 'descricao' },
  { id: 'condicao-pagamento', endpoint: 'condicoes-de-pagamento', prop: 'descricao' },
  { id: 'meio-pagamento', endpoint: 'meios-de-pagamento', prop: 'descricao' },
  { id: 'raca', endpoint: 'racas', prop: 'descricao' },
  { id: 'pet', endpoint: 'pets', prop: 'nome' },
  { id: 'status', endpoint: 'status', prop: 'descricao' }
];

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', init);

async function init() {
  console.log('🚀 Iniciando módulo de tabela de preços...');
  try {
    await loadAllSelects();
    setupForm();
    setupMutualExclusion();
  } catch (error) {
    console.error('💥 Erro na inicialização:', error);
    showError('Falha ao carregar a página. Recarregue e tente novamente.');
  }
}

// ==================== CARREGAMENTO DOS SELECTS ====================
async function loadAllSelects() {
  console.log('🔄 Carregando selects...');
  
  const loadPromises = SELECT_CONFIG.map(config => {
    return loadSelect(config).catch(error => {
      console.error(`Erro ao carregar ${config.id}:`, error);
      return null;
    });
  });

  await Promise.all(loadPromises);
  console.log('✅ Selects carregados com sucesso!');
}

async function loadSelect({ id, endpoint, prop }) {
  const select = document.getElementById(id);
  if (!select) throw new Error(`Elemento #${id} não encontrado`);

  try {
    const { data } = await axios.get(`${API_BASE_URL}/${endpoint}`);
    select.innerHTML = `<option value="">Selecione...</option>`;
    
    data.forEach(item => {
      const option = new Option(
        item[prop] || `ID: ${item.id}`,
        item.id
      );
      select.add(option);
    });
  } catch (error) {
    select.innerHTML = `<option value="">Erro ao carregar</option>`;
    throw error;
  }
}

// ==================== EXCLUSÃO MÚTUA ====================
function setupMutualExclusion() {
  const racaSelect = document.getElementById('raca');
  const petSelect = document.getElementById('pet');

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
    const { data } = await axios.post(`${API_BASE_URL}/tabela-de-precos`, formData);
    showSuccess(data);
    form.reset();
    document.getElementById('raca').disabled = false;
    document.getElementById('pet').disabled = false;
  } catch (error) {
    showError(error);
  } finally {
    hideLoading();
  }
}

function getFormData(form) {
  return {
    servicoId: parseInt(form.servico.value),
    condicaoDePagamentoId: parseInt(form['condicao-pagamento'].value),
    meioDePagamentoId: parseInt(form['meio-pagamento'].value),
    racaId: form.raca.value ? parseInt(form.raca.value) : NaN,
    petId: form.pet.value ? parseInt(form.pet.value) : NaN,
    valorServico: parseFloat(form['valor-servico'].value.replace(',', '.')),
    statusId: parseInt(form.status.value)
  };
}

function validateFormData(data) {
  const obrigatorios = [
    data.servicoId,
    data.condicaoDePagamentoId,
    data.meioDePagamentoId,
    data.valorServico,
    data.statusId
  ];

  const peloMenosUm = !isNaN(data.racaId) || !isNaN(data.petId);

  return obrigatorios.every(val => !isNaN(val)) && peloMenosUm;
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

  const valorFormatado = formatCurrency(data.valorServico);
  
  divCadastro.innerHTML = `
    <div class="alert success">
      <h3><i class="fa fa-check-circle"></i> Registro cadastrado!</h3>
      <p><strong>Serviço:</strong> ${data.servico?.descricao || 'N/A'}</p>
      <p><strong>Valor:</strong> ${valorFormatado}</p>
      <div class="actions">
        <button class="btn btn-edit" onclick="editarRegistro(${data.id})">
          <i class="fa fa-edit"></i> Editar
        </button>
        <button class="btn btn-delete" onclick="excluirRegistro(${data.id})">
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
  
  alert(errorMessage); // Fallback básico
}

// ==================== UTILITÁRIOS ====================
function formatCurrency(value) {
  const num = parseFloat(value) || 0;
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function getErrorMessage(error) {
  if (typeof error === 'string') return error;
  if (error.response?.data) {
    return error.response.data.erro || 
           error.response.data.message || 
           'Erro no servidor. Tente novamente.';
  }
  return error.message || 'Erro desconhecido';
}

// ==================== FUNÇÕES GLOBAIS ====================
window.editarRegistro = (id) => {
  console.log('Editando registro:', id);
  // Implementar lógica de edição
};

window.excluirRegistro = (id) => {
  if (confirm('Tem certeza que deseja excluir este registro?')) {
    console.log('Excluindo registro:', id);
    // Implementar lógica de exclusão
  }
};
