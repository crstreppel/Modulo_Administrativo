/* =============================================================
 * Arquivo app.js • v4.3 - Padrão Bruxão Modular & Clean 🧙‍♂️
 * -------------------------------------------------------------
 * - Mantém estrutura original da versão 1
 * - Acrescenta rotas de segurança (auth e usuários)
 * - Adiciona suporte a cookies (para refresh tokens)
 * - Mantém verificação anti-caos e logs padrão Bruxão
 * -------------------------------------------------------------
*/

const fs = require('fs');
const path = require('path');

// =============================================================
// 🔮 Verificador Bruxônico Anti-Caos v2.0
// =============================================================
(function verificarFrontendNoBackend() {
  const backendDir = path.join(__dirname);
  const ignorarPastas = ['node_modules', 'config', 'utils', '.git'];
  const ignorarArquivos = ['app.js', 'check_frontend_mistake.js'];

  let erroDetectado = false;
  function verificarArquivos(dir) {
    const arquivos = fs.readdirSync(dir);
    arquivos.forEach((arquivo) => {
      const caminho = path.join(dir, arquivo);
      const stat = fs.statSync(caminho);
      if (
        ignorarPastas.some((p) => caminho.includes(p)) ||
        ignorarArquivos.includes(arquivo)
      ) return;
      if (stat.isDirectory()) return verificarArquivos(caminho);
      if (arquivo.endsWith('.js')) {
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
// Dependências principais
// =============================================================
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { sequelize } = require('./config/db');
const { runDatabaseSetup } = require('./utils');

// ===== Patch: flag de force via CLI/env =====
const FORCE_SYNC =
  process.argv.includes('--force') ||
  process.env.FORCE_SYNC === '1';

if (process.env.NODE_ENV === 'production' && FORCE_SYNC) {
  console.error('🚫 Bloqueado: force:true em produção.');
  process.exit(1);
}

console.log(FORCE_SYNC ? '⚠️ Rodando com force:true' : '✅ Rodando sem force:true');

// =============================================================
// Rotas dos módulos existentes
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

// === Novas rotas de segurança (V2 → V1) ===
const authRoutes = require('./routes/authRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');

const app = express();

// Importa associações
require('./models/associations');

// Middlewares globais
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Rota teste raiz
app.get('/', (req, res) => {
  res.send('API do Módulo Administrativo está rodando. 🧩');
});

// =============================================================
// Definição de Rotas
// =============================================================
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

// 🔐 Rotas de segurança (autenticação e gestão de usuários)
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);

// =============================================================
// Inicialização do servidor
// =============================================================
const PORT = 3000;

app.listen(PORT, async () => {
  try {
    await sequelize.sync({ force: FORCE_SYNC, logging: false });
    console.log('🧠 Sequelize sincronizado com sucesso.');

    await runDatabaseSetup();
    console.log(`🔥 Servidor rodando em http://localhost:${PORT}  (BASE DE TESTES DEV)`);

  } catch (error) {
    console.error('❌ Erro ao sincronizar com o banco:', error);
  }
});
