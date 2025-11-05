/* =============================================================
 * Arquivo: lista_fornecedores.js
 * -------------------------------------------------------------
 * Padrão PBQE – Tela 2: Consulta/Listagem de Fornecedores
 * ============================================================= */

const apiUrl = '/api/fornecedores';

document.addEventListener('DOMContentLoaded', () => {
  console.log('📋 [PBQE] Tela de listagem carregada.');

  const campoBusca = document.getElementById('campoBusca');
  const btnAtualizar = document.getElementById('btnAtualizar');
  const btnVoltar = document.getElementById('btnVoltar');

  btnAtualizar.addEventListener('click', listarFornecedores);
  btnVoltar.addEventListener('click', () => window.location.href = '/dashboard.html');
  campoBusca.addEventListener('input', filtrarTabela);

  listarFornecedores();
});

function mostrarLoading(exibir) {
  document.getElementById('loading').classList.toggle('hidden', !exibir);
}

/* =============================================================
 * 🧩 Listar fornecedores
 * ============================================================= */
async function listarFornecedores() {
  try {
    mostrarLoading(true);
    const res = await axios.get(apiUrl);
    preencherTabela(res.data);
  } catch (err) {
    console.error('❌ Erro ao listar fornecedores:', err);
    alert('Erro ao carregar fornecedores.');
  } finally {
    mostrarLoading(false);
  }
}

/* =============================================================
 * 🧮 Preencher tabela
 * ============================================================= */
function preencherTabela(fornecedores) {
  const tbody = document.querySelector('#tabelaFornecedores tbody');
  tbody.innerHTML = '';

  fornecedores.forEach((f) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${f.id}</td>
      <td>${f.nomeFantasia || '-'}</td>
      <td>${f.cpfCnpj || '-'}</td>
      <td>${f.tipoFornecedor || '-'}</td>
      <td>${f.emailPrincipal || '-'}</td>
      <td>${f.telefonePrincipal || '-'}</td>
      <td>${f.ativo ? '✅' : '❌'}</td>
    `;
    tr.addEventListener('click', () => exibirDetalhes(f));
    tbody.appendChild(tr);
  });

  console.log(`✅ ${fornecedores.length} fornecedores listados.`);
}

/* =============================================================
 * 🔍 Filtro de busca
 * ============================================================= */
function filtrarTabela() {
  const termo = document.getElementById('campoBusca').value.toLowerCase();
  const linhas = document.querySelectorAll('#tabelaFornecedores tbody tr');
  linhas.forEach((linha) => {
    const texto = linha.innerText.toLowerCase();
    linha.style.display = texto.includes(termo) ? '' : 'none';
  });
}

/* =============================================================
 * 📋 Exibir detalhes do fornecedor
 * ============================================================= */
function exibirDetalhes(f) {
  const detalhes = `
  ID: ${f.id}\n
  Razão Social: ${f.razaoSocial}\n
  Nome Fantasia: ${f.nomeFantasia}\n
  CPF/CNPJ: ${f.cpfCnpj}\n
  Tipo: ${f.tipoFornecedor}\n
  E-mail: ${f.emailPrincipal}\n
  Telefone: ${f.telefonePrincipal}\n
  Ativo: ${f.ativo ? 'Sim' : 'Não'}
  `;
  alert(detalhes);
}
