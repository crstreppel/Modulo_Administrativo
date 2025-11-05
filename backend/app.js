/* =============================================================
 * Arquivo app.js • v4.5.6 - Padrão Bruxão Modular & Clean 🧙‍♂️
 * -------------------------------------------------------------
 * - Mantém estrutura original da versão 1
 * - Integração modular unificada para Fornecedores
 * - Rotas estáticas corrigidas (frontend global + módulos)
 * ============================================================= */

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { sequelize } = require('./config/db');
const { runDatabaseSetup } = require('./utils');

// =============================================================
// 🔮 Verificador Bruxônico Anti-Caos v2.1
// =============================================================
(function verificarFrontendNoBackend() {
  const backendDir = path.join(__dirname);
  const ignorarPastas = ['node_modules', 'config', 'utils', '.git', 'frontend'];
  const ignorarArquivos = ['app.js', 'check_frontend_mistake.js'];
  let erroDetectado = false;

  function verificarArquivos(dir) {
    const arquivos = fs.readdirSync(dir);
    arquivos.forEach((arquivo) => {
      const caminho = path.join(dir, arquivo);
      const stat = fs.statSync(caminho);

      if (ignorarPastas.some((p) => caminho.includes(p)) || ignorarArquivos.includes(arquivo)) return;

      if (stat.isDirectory()) {
        verificarArquivos(caminho);
      } else if (arquivo.endsWith('.js')) {
        const conteudo = fs.readFileSync(caminho, 'utf8');
        if (conteudo.includes('document.') || conteudo.includes('window.')) {
          console.log(`🚨 FRONTEND DETECTADO no backend: ${caminho}`);
          erroDetectado = true;
        }
      }
    });
  }

  verificarArquivos(backendDir);

  if (erroDetectado) {
    console.error('\n❌ Servidor abortado: Código de frontend detectado no backend!\n');
    process.exit(1);
  } else {
    console.log('✅ Verificação Bruxônica: Backend limpo. Nenhum código de frontend detectado.\n');
  }
})();

// =============================================================
// ⚙️ Configuração do modo de sincronização
// =============================================================
const FORCE_SYNC = process.argv.includes('--force') || process.env.FORCE_SYNC === '1';
if (process.env.NODE_ENV === 'production' && FORCE_SYNC) {
  console.error('🚫 Bloqueado: force:true em produção.');
  process.exit(1);
}
console.log(FORCE_SYNC ? '⚠️ Rodando com force:true' : '✅ Rodando sem force:true');

// =============================================================
// Importação de rotas dos módulos
// =============================================================
const statusRoutes = require('./routes/statusRoutes');
const servicosRoutes = require('./routes/servicosRoutes');
const racasRoutes = require('./routes/racasRoutes');
const clientesRoutes = require('./routes/clientesRoutes');
const especieRoutes = require('./routes/especieRoutes');
const condicaoDePagamentoRoutes = require('./routes/condicaoDePagamentoRoutes');
const meioDePagamentoRoutes = require('./routes/meioDePagamentoRoutes');
const petsRoutes = require('./routes/petsRoutes');
const tabelaDePrecosRoutes = require('./routes/tabelaDePrecosRoutes');
const movimentosRoutes = require('./routes/movimentosRoutes');
const contasAReceberRoutes = require('./routes/contasAReceberRoutes');
const authRoutes = require('./routes/authRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const fornecedoresRoutes = require('./modules/fornecedores/fornecedorRoutes');

// =============================================================
// Inicialização do app e middlewares globais
// =============================================================
const app = express();
require('./models/associations');

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// =============================================================
// 🌐 Servir Frontend Estático (global e modular)
// =============================================================

// --- Frontend global (permite acessar /frontend/css/... etc.)
const frontendPath = path.join(__dirname, 'frontend');
app.use('/frontend', express.static(frontendPath));
app.use(express.static(frontendPath)); // mantém compatibilidade com v1

// --- Módulo Fornecedores (rota completa com frontend incluído)
const fornecedoresPath = path.join(__dirname, 'modules', 'fornecedores');
app.use('/modules/fornecedores', express.static(fornecedoresPath));
app.use('/modules/fornecedores/frontend', express.static(path.join(fornecedoresPath, 'frontend')));

// =============================================================
// Rotas principais (API)
// =============================================================
app.get('/api', (req, res) => {
  res.send('API do Módulo Administrativo está rodando. 🧩');
});

app.use('/api/status', statusRoutes);
app.use('/api/servicos', servicosRoutes);
app.use('/api/racas', racasRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/especies', especieRoutes);
app.use('/api/condicoes-de-pagamento', condicaoDePagamentoRoutes);
app.use('/api/meios-de-pagamento', meioDePagamentoRoutes);
app.use('/api/pets', petsRoutes);
app.use('/api/tabela-de-precos', tabelaDePrecosRoutes);
app.use('/api/movimentos', movimentosRoutes);
app.use('/api/contas-a-receber', contasAReceberRoutes);

// --- Módulo Fornecedores (API)
app.use('/api/fornecedores', fornecedoresRoutes);

// --- Rotas de segurança
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);

// =============================================================
// 🔁 Redirecionamento padrão para dashboard
// =============================================================
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'dashboard.html'));
});

// =============================================================
// 🚀 Inicialização do servidor
// =============================================================
const PORT = 3000;

app.listen(PORT, async () => {
  try {
    await sequelize.sync({ force: FORCE_SYNC, logging: false });
    console.log('🧠 Sequelize sincronizado com sucesso.');
    await runDatabaseSetup();
    console.log(`🔥 Servidor rodando em http://localhost:${PORT}  (BASE DE TESTES DEV)`);
    console.log('🌍 Frontend disponível em http://localhost:3000/dashboard.html');
  } catch (error) {
    console.error('❌ Erro ao sincronizar com o banco:', error);
  }
});
