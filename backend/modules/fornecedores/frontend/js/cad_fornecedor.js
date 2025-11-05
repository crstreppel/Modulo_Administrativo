/* =============================================================
 * Arquivo: cad_fornecedor.js
 * -------------------------------------------------------------
 * 📦 Módulo: Fornecedores
 * 🧱 Padrão: PBQE-C™ v2.1 — Estrutura Modular com Require Explícito
 * 🔒 Versão Anti-Duplo Submit™ — Claudião & Bruxão 🧙‍♂️
 * ============================================================= */

const apiUrl = '/api/fornecedores';

// -------------------------------------------------------------
// 🪄 Inicialização
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ [PBQE-C] Script do módulo Fornecedores carregado.');

  const loader = document.getElementById('loading');
  const form = document.getElementById('formFornecedor');
  const btnSalvar = document.getElementById('btnSalvar');
  const btnLimpar = document.getElementById('btnLimpar');
  const btnVoltar = document.getElementById('btnVoltar');

  if (loader) loader.classList.add('hidden');

  btnSalvar?.addEventListener('click', () =>
    console.log('💾 [PBQE-C] Botão Salvar clicado.')
  );

  btnLimpar?.addEventListener('click', () => {
    console.log('🧹 [PBQE-C] Botão Limpar clicado.');
    limparFormulario();
  });

  btnVoltar?.addEventListener('click', () => {
    console.log('⬅️ [PBQE-C] Botão Voltar clicado.');
    window.location.href = '/dashboard.html';
  });

  form?.addEventListener('submit', salvarFornecedor);
});

// -------------------------------------------------------------
// 🔄 Controle de Loader
// -------------------------------------------------------------
function mostrarLoading(exibir) {
  const loader = document.getElementById('loading');
  if (!loader) return;
  loader.classList.toggle('hidden', !exibir);
}

// -------------------------------------------------------------
// 🧾 Coleta dos dados do formulário
// -------------------------------------------------------------
function coletarDados() {
  const getValue = (id) => document.getElementById(id)?.value?.trim() || '';

  const dados = {
    tipoPessoa: getValue('tipoPessoa'),
    razaoSocial: getValue('razaoSocial'),
    nomeFantasia: getValue('nomeFantasia'),
    cpfCnpj: getValue('cpfCnpj'),
    inscricaoEstadual: getValue('inscricaoEstadual'),
    emailPrincipal: getValue('emailPrincipal'),
    telefonePrincipal: getValue('telefonePrincipal'),
    tipoFornecedor: getValue('tipoFornecedor'),
    scoreAtual: parseFloat(getValue('scoreAtual')) || 0,
    ativo: getValue('ativo') === 'true',
    observacoes: getValue('observacoes')
  };

  console.log('📋 [PBQE-C] Dados coletados:', dados);
  return dados;
}

// -------------------------------------------------------------
// 💾 Envio de dados ao backend (Create)
// -------------------------------------------------------------
async function salvarFornecedor(event) {
  event.preventDefault();

  mostrarLoading(true);
  console.log('🟢 [PBQE-C] Iniciando envio ao backend...');

  const dados = coletarDados();

  // Validação básica de campos obrigatórios
  if (!dados.tipoPessoa || !dados.razaoSocial || !dados.cpfCnpj || !dados.tipoFornecedor) {
    alert('Preencha todos os campos obrigatórios.');
    mostrarLoading(false);
    return;
  }

  try {
    const resposta = await axios.post(apiUrl, dados);
    console.log('✅ [PBQE-C] Fornecedor criado:', resposta.data);
    alert('Fornecedor cadastrado com sucesso!');
    limparFormulario();
  } catch (erro) {
    console.error('❌ [PBQE-C] Erro ao salvar fornecedor:', erro);
    const msg = erro.response?.data?.mensagem || 'Erro ao cadastrar fornecedor.';
    alert(`${msg} Verifique o console para mais detalhes.`);
  } finally {
    mostrarLoading(false);
  }
}

// -------------------------------------------------------------
// 🧹 Reset do formulário
// -------------------------------------------------------------
function limparFormulario() {
  const form = document.getElementById('formFornecedor');
  form?.reset();
  console.log('🧽 [PBQE-C] Formulário limpo.');
}
