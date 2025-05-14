const popularStatus = require('./popular_tab_status');
const popularServicos = require('./popular_tab_servicos');
const { sequelize } = require('../config/db');

async function main() {
  try {
    console.log('🚀 Iniciando população das tabelas...');
    
    // Ordem crítica: Status -> Servicos
    await popularStatus();
    await popularServicos();
    
    console.log('✨ Tabelas populadas com sucesso!');
  } catch (error) {
    console.error('💥 Falha na execução:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

main();