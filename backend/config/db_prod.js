// backend/config/db.js

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('PatyPet', 'claudio', '270172', {
  host: 'localhost',
  port: 5432,
  dialect: 'postgres',
  logging: false, // você pode colocar true para ver os logs do SQL
});

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o banco de dados foi estabelecida com sucesso.');
  } catch (error) {
    console.error('Não foi possível conectar ao banco de dados:', error);
  }
}

module.exports = { sequelize, testConnection };
