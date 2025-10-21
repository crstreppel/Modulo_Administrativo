/* =============================================================
 * Arquivo app.js • v4.2 - Padrão Bruxão Modular & Clean 🧙‍♂️
 * -------------------------------------------------------------
 * - Mantém estrutura original da versão 1
 * - Remove SQL inline (agora em utils/)
 * - Executa criação de funções, triggers e views automaticamente
 * - Ignora movimentos CANCELADO (7) e AJUSTE (8)
 * - Logs padronizados estilo Bruxão
 * - Verificação automática anti-caos refinada (ignora libs e utilitários)
 * -------------------------------------------------------------
*/

const fs = require('fs');
const path = require('path');

// =============================================================
// 🔮 Verificador Bruxônico Anti-Caos v2.0
// -------------------------------------------------------------
// Bloqueia o servidor se detectar código de frontend (document/window)
// em qualquer arquivo do backend, ignorando node_modules e utilitários.
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

      // Ignora pastas e arquivos específicos
      if (
        ignorarPastas.some((p) => caminho.includes(p)) ||
        ignorarArquivos.includes(arquivo)
      ) {
        return;
      }

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
// Dependências principais
// =============================================================
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./config/db'); // conexão direta
const { runDatabaseSetup } = require('./utils'); // orquestra funções/triggers/views

// ===== Patch: flag de force via CLI/env =====
// Liga com: `node app.js --force` ou `FORCE_SYNC=1 node app.js`
// (Windows CMD: `set FORCE_SYNC=1 && node app.js`)
const FORCE_SYNC =
  process.argv.includes('--force') ||
  process.env.FORCE_SYNC === '1';

if (process.env.NODE_ENV === 'production' && FORCE_SYNC) {
  console.error('🚫 Bloqueado: force:true em produção.');
  process.exit(1);
}

console.log(FORCE_SYNC ? '⚠️ Rodando com force:true' : '✅ Rodando sem force:true');

// =============================================================
// Rotas
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

const app = express();

// Importa as associações entre os models
require('./models/associations');

// Middlewares
app.use(cors());
app.use(express.json());

// Rota teste raiz
app.get('/', (req, res) => {
  res.send('API do Módulo Administrativo está rodando. 🧩');
});

// Define rotas
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

// =============================================================
// Inicializa servidor
// =============================================================
const PORT = 3000;

app.listen(PORT, async () => {
  try {
    await sequelize.sync({ force: FORCE_SYNC, logging: false });
    console.log('🧠 Sequelize sincronizado com sucesso.');

    // Chamada única para criar todas as funções/triggers/views
    await runDatabaseSetup();

    console.log(`🔥 Servidor rodando em http://localhost:${PORT}  B A S E  D E  T E S T E S`);
  } catch (error) {
    console.error('❌ Erro ao sincronizar com o banco:', error);
  }
});
