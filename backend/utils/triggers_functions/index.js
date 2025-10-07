/* =============================================================
 * utils/triggers_+_functions/index.js • v1.1 — Padrão Bruxão
 * -------------------------------------------------------------
 * Centraliza a execução de todas as funções/triggers SQL
 * -------------------------------------------------------------
*/

const { createGerarTitulos } = require('./create_gerar_titulos');
const { createGerenciarAdiantamentos } = require('./create_gerenciar_adiantamentos'); // ✅ plural
const { createCancelarViaAjuste } = require('./create_cancelar_via_ajuste');

async function createAllTriggersAndFunctions() {
  console.log('\n🧙 Iniciando criação de triggers e funções SQL...');

  try {
    await createGerenciarAdiantamentos();
    await createGerarTitulos();
    await createCancelarViaAjuste();

    console.log('✅ Todas as triggers e funções criadas com sucesso!\n');
  } catch (error) {
    console.error('💥 Erro ao criar triggers/funções SQL:', error.message);
  }
}

module.exports = { createAllTriggersAndFunctions };
