/* =============================================================
 * Arquivo: cad_fornecedor.js
 * -------------------------------------------------------------
 * Versão PBQE Anti-Duplo Submit™ — Bruxão & Claudião 🧙‍♂️
 * ============================================================= */

const apiUrl = '/api/fornecedores';

document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ [PBQE] Script carregado e DOM pronto.');

  // 🔮 Garante que o overlay comece sempre oculto
  const loader = document.getElementById('loading');
  if (loader) loader.classList.add('hidden');

  const form = document.getElementById('formFornecedor');
  const btnSalvar = document.getElementById('btnSalvar');
  const btnLimpar = document.getElementById('btnLimpar');
  const btnVoltar = document.getElementById('btnVoltar');

  // 💾 Botão Salvar (apenas log — sem forçar submit)
  btnSalvar.addEventListener('click', () => {
    console.log('💾 [PBQE] Botão Salvar clicado.');
  });

  // 🧹 Botão Limpar
  btnLimpar.addEventListener('click', () => {
    console.log('🧹 [PBQE] Botão Limpar clicado.');
    limparFormulario();
  });

  // ⬅️ Botão Voltar
  btnVoltar.addEventListener('click', () => {
    console.log('⬅️ [PBQE] Botão Voltar clicado.');
    window.location.href = '/dashboard.html';
  });

  // 📝 Evento de envio do formulário
  form.addEventListener('submit', salvarFornecedor);
});

function mostrarLoading(exibir) {
  const loader = document.getElementById('loading');
  if (!loader) return;
  loader.classList.toggle('hidden', !exibir);
}

function coletarDados() {
  const dados = {
    tipoPessoa: document.getElementById('tipoPessoa').value,
    razaoSocial: document.getElementById('razaoSocial').value,
    nomeFantasia: document.getElementById('nomeFantasia').value,
    cpfCnpj: document.getElementById('cpfCnpj').value,
    inscricaoEstadual: document.getElementById('inscricaoEstadual').value,
    emailPrincipal: document.getElementById('emailPrincipal').value,
    telefonePrincipal: document.getElementById('telefonePrincipal').value,
    tipoFornecedor: document.getElementById('tipoFornecedor').value,
    scoreAtual: document.getElementById('scoreAtual').value,
    ativo: document.getElementById('ativo').value === 'true',
    observacoes: document.getElementById('observacoes').value
  };
  console.log('📋 [PBQE] Dados coletados:', dados);
  return dados;
}

async function salvarFornecedor(e) {
  e.preventDefault();
  mostrarLoading(true);
  console.log('🟢 [PBQE] Iniciando envio ao backend...');

  const dados = coletarDados();

  if (!dados.tipoPessoa || !dados.razaoSocial || !dados.cpfCnpj || !dados.tipoFornecedor) {
    alert('Preencha todos os campos obrigatórios.');
    mostrarLoading(false);
    return;
  }

  try {
    const res = await axios.post(apiUrl, dados);
    console.log('✅ [PBQE] Fornecedor criado:', res.data);
    alert('Fornecedor cadastrado com sucesso!');
    limparFormulario();
  } catch (err) {
    console.error('❌ [PBQE] Erro ao salvar fornecedor:', err);
    alert('Erro ao cadastrar fornecedor. Verifique o console.');
  } finally {
    mostrarLoading(false);
  }
}

function limparFormulario() {
  document.getElementById('formFornecedor').reset();
}
