const popularStatus = require('./pop_tab_status');
const popularServicos = require('./pop_tab_servicos');
const popularRacas = require('./pop_tab_racas')

const { sequelize } = require('../config/db');

async function main() {
  try {
    console.log('🚀 Iniciando população das tabelas...');

    // Ordem crítica: Status -> Servicos -> Raças
    await popularStatus();
    await popularServicos();
    await popularRacas();
    

    // Corrige a sequência do ID da tabela racas
    await sequelize.query(`SELECT setval('racas_id_seq', (SELECT MAX(id) FROM racas));`);

    console.log('✨ Tabelas populadas com sucesso!');
  } catch (error) {
    console.error('💥 Falha na execução:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

main();
