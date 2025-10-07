/* =============================================================
 * utils/index.js • v2.2 — Orquestrador SQL Supremo 🧙‍♂️
 * -------------------------------------------------------------
 * - Executa todas as funções e triggers (pasta triggers_functions)
 * - Executa todas as views (pasta views)
 * - À prova de OneDrive, de sustos e de burradas cósmicas
 * -------------------------------------------------------------
 */

const path = require('path');

let createAllTriggersAndFunctions = null;
let createViews = null;

// =============================================================
// Carrega TRIGGERS + FUNCTIONS
// =============================================================
try {
  const triggersModPath = require.resolve(path.join(__dirname, 'triggers_functions', 'index.js'));
  const triggersMod = require(triggersModPath);

  createAllTriggersAndFunctions =
    typeof triggersMod === 'function'
      ? triggersMod
      : triggersMod.createAllTriggersAndFunctions;

  if (!createAllTriggersAndFunctions) {
    console.warn('⚠️ Nenhuma função createAllTriggersAndFunctions encontrada.');
  }
} catch (e) {
  console.warn(`⚠️ Erro ao carregar módulo triggers/functions: ${e.message}`);
}

// =============================================================
// Carrega VIEWS (modo à prova de OneDrive e cache quebrado)
// =============================================================
try {
  const fullPathViews = require.resolve(path.join(__dirname, 'views', 'index.js'));
  const viewsMod = require(fullPathViews);

  createViews =
    typeof viewsMod === 'function'
      ? viewsMod
      : viewsMod.createViews;

  if (!createViews) {
    console.warn('⚠️ Nenhuma função createViews encontrada.');
  }
} catch (e) {
  console.warn(`⚠️ Erro ao carregar módulo de views: ${e.message}`);
}

// =============================================================
// EXECUÇÃO GERAL
// =============================================================
async function runDatabaseSetup() {
  console.log('\n🧙 Iniciando setup SQL padrão Bruxão...');

  try {
    // === TRIGGERS & FUNCTIONS ===
    if (typeof createAllTriggersAndFunctions === 'function') {
      await createAllTriggersAndFunctions();
    } else {
      console.warn('⚠️ Nenhum módulo válido de triggers/functions para executar.');
    }

    // === VIEWS ===
    if (typeof createViews === 'function') {
      console.log('📊 Criando views SQL...');
      await createViews();
    } else {
      console.warn('⚠️ Nenhuma função de criação de views encontrada.');
    }

    console.log('✨ Setup SQL concluído com sucesso!\n');
  } catch (err) {
    console.error('💥 Erro durante setup SQL:', err.message);
  }
}

module.exports = { runDatabaseSetup };
