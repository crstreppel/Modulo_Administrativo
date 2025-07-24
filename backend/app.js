const express = require('express');
const cors = require('cors');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🔧 Selecione o ambiente:');
console.log('1 - Desenvolvimento');
console.log('2 - Produção\n');

rl.question('Digite 1 ou 2 e pressione Enter: ', async (resposta) => {
  let dbPath;
  let forceSync = false;

  if (resposta === '1') {
    dbPath = './config/db_dev';
    forceSync = true;
    console.log('\n🛠️ Carregando ambiente de desenvolvimento...\n');
  } else if (resposta === '2') {
    dbPath = './config/db_prod';
    forceSync = false;
    console.log('\n🚀 Carregando ambiente de produção...\n');
  } else {
    console.log('❌ Opção inválida. Encerrando...');
    rl.close();
    return;
  }

  const { sequelize } = require(dbPath);

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

  const app = express();

  // Importa as associações entre os models
  require('./models/associations');

  // Middlewares
  app.use(cors());
  app.use(express.json());

  // Teste de rota principal
  app.get('/', (req, res) => {
    res.send('API do Módulo Administrativo está rodando.');
  });

  // Rotas
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

  // Inicializa o servidor
  const PORT = 3000;
  app.listen(PORT, async () => {
    try {
      await sequelize.sync({ force: forceSync, logging: false });
      console.log(`🔥 Servidor rodando em http://localhost:${PORT}`);
      console.log(`🔄 sync() executado com force: ${forceSync}`);
    } catch (error) {
      console.error('❌ Erro ao sincronizar com o banco:', error);
    }
  });

  rl.close();
});
