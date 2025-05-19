const popularStatus = require('./popular_tab_status');
const popularServicos = require('./popular_tab_servicos');
const popularRacas = require('./popular_tab_racas');
const popularClientes = require('./pop_tabela_clientes');
const { sequelize } = require('../config/db');

async function main() {
  try {
    console.log('🚀 Iniciando população das tabelas...');

    // Ordem crítica: Status -> Servicos -> Raças
    await popularStatus();
    await popularServicos();
    await popularRacas();
    await popularClientes();

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
