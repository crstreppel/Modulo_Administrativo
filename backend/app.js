const express = require('express');
const cors = require('cors');
const { sequelize } = require('./config/db');

const statusRoutes = require('./routes/statusRoutes');
const servicosRoutes = require('./routes/servicosRoutes');
const racasRoutes = require('./routes/racasRoutes');
const clientesRoutes = require('./routes/clientesRoutes');
const especieRoutes = require('./routes/especieRoutes'); 
const condicaoDePagamentoRoutes = require('./routes/condicaoDePagamentoRoutes');
const meioDePagamentoRoutes = require('./routes/meioDePagamentoRoutes');
const petsRoutes = require('./routes/petsRoutes');
const tabelaDePrecosRoutes = require('./routes/tabelaDePrecosRoutes');
const movimentosRoutes = require('./routes/movimentosRoutes'); // <-- Adicionado

const app = express();

// Importa as associações entre os models (MUITO IMPORTANTE!)
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
app.use('/api/movimentos', movimentosRoutes); // <-- Rota nova, respeitando padrão

// Inicializa o servidor
const PORT = 3000;
app.listen(PORT, async () => {
  try {
    await sequelize.sync({ force: false, logging: false  }); // 🔥 Agora não apaga mais nada!
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  } catch (error) {
    console.error('Erro ao sincronizar com o banco:', error);
  }
});
