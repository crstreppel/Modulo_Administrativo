/* =============================================================
 * utils/views/index.js — Centralizador de Views
 * -------------------------------------------------------------
 * Chama todas as views da aplicação
 * -------------------------------------------------------------
*/

const { createViewAuditoriaResumida } = require('./create_vw_auditoria_resumida');

async function createViews() {
  console.log('\n📊 Criando views SQL...');
  await createViewAuditoriaResumida();
  console.log('📈 Todas as views criadas com sucesso.\n');
}

module.exports = { createViews };
