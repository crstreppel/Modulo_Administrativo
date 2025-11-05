// =============================================================
// 🧮 Validação Pós-Seed • Módulo Fornecedores
// -------------------------------------------------------------
// Executa com: `node seeders/checkFornecedores.js`
// Verifica quantidade total e exibe 5 registros aleatórios
// Padrão: PBQE-C™ v2.6.4 — Logs humanizados
// =============================================================

const { sequelize } = require('../config/db');
const Fornecedor = require('../modules/fornecedores/fornecedorModel');

async function run() {
  try {
    console.log('🔌 [PBQE-C] Conectando ao banco para verificação...');
    await sequelize.authenticate();
    console.log('✅ [PBQE-C] Conexão ativa.\n');

    // === Contagem total
    const total = await Fornecedor.count();
    console.log(`📊 [PBQE-C] Total de fornecedores cadastrados: ${total}`);

    if (total === 0) {
      console.warn('⚠️ [PBQE-C] Nenhum fornecedor encontrado. Roda o seed primeiro!');
      return;
    }

    // === Selecionar 5 registros aleatórios
    const exemplos = await Fornecedor.findAll({
      order: sequelize.random(),
      limit: 5,
      attributes: [
        'id',
        'razaoSocial',
        'tipoPessoa',
        'tipoFornecedor',
        'statusId',
        'ativo',
        'scoreAtual'
      ]
    });

    console.log('\n🧩 [PBQE-C] Amostra aleatória de fornecedores:');
    exemplos.forEach((f) => {
      console.log(
        `  → #${f.id.toString().padStart(4, '0')} | ${f.razaoSocial.padEnd(25)} | Tipo: ${
          f.tipoPessoa
        } | Forn: ${f.tipoFornecedor.padEnd(8)} | Ativo: ${f.ativo ? '✅' : '❌'} | Score: ${f.scoreAtual}`
      );
    });

    console.log('\n🏁 [PBQE-C] Verificação concluída com sucesso.');
  } catch (err) {
    console.error('💥 [PBQE-C] Erro durante verificação de fornecedores:', err);
  } finally {
    await sequelize.close();
    console.log('\n🔒 [PBQE-C] Conexão encerrada com segurança.\n');
  }
}

if (require.main === module) {
  run().catch(() => process.exit(1));
}

module.exports = { run };
