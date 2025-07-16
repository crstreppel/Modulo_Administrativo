const popularStatus = require('./pop_tab_status');
const popularServicos = require('./pop_tab_servicos');
const popularEspecies = require('./pop_tab_especies');
const popularRacas = require('./pop_tab_racas');
const popularMeioDePagamento = require('./pop_tab_MeioDePagamento');
const popularCondicaoDePagamento = require('./pop_tab_CondicaoDePagamento');
const popularTabelaDePrecos = require('./pop_tab_tabeladeprecos');
const popularClientes = require('./pop_tab_clientes');
const popularPets = require('./pop_tab_pets');

const { sequelize } = require('../config/db');

async function main() {
  try {
    console.log('🚀 Iniciando população das tabelas...');

    await popularStatus();
    await popularServicos();
    await popularEspecies();
    await popularRacas();
    await popularMeioDePagamento();
    await popularCondicaoDePagamento();
  //  await popularTabelaDePrecos(); // << AQUI O BRABO FOI ENCAIXADO
  //  await popularClientes();
  //  await popularPets();

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
