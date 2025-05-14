// backend/app.js

const express = require('express');
const cors = require('cors');
const { sequelize } = require('./config/db');
const statusRoutes = require('./routes/statusRoutes');  // Importando as rotas de status

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Teste de rota principal
app.get('/', (req, res) => {
  res.send('API do Módulo Administrativo está rodando.');
});

// Usando as rotas de status
app.use('/api/status', statusRoutes);

// Inicializa o servidor
const PORT = 3000;
app.listen(PORT, async () => {
  try {
    await sequelize.sync(); // Cria as tabelas com base nos models
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  } catch (error) {
    console.error('Erro ao sincronizar com o banco:', error);
  }
});
