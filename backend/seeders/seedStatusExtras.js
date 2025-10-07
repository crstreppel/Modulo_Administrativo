/* ------------------------------------------------------------------
 * Seeder: seedStatusExtras.js  •  v1.1 - Padrão Bruxão (corrigido)
 * - Compatível com versão 1 (sem index.js e model já instanciado)
 * - Cria os status CANCELADO (7) e AJUSTE (8) se não existirem
 * - Ajusta a sequence do Postgres após inserções com ID fixo
 * ------------------------------------------------------------------ */

const { sequelize } = require('../config/db');
const Status = require('../models/Status'); // model já instanciado, sem factory

async function ensureStatus({ id, descricao }, transaction) {
  // 1️⃣ Tenta localizar pelo ID
  let found = await Status.findOne({ where: { id }, transaction });
  if (found) {
    console.log(`✅ Status ${id} "${descricao}" já existe (por ID).`);
    return found;
  }

  // 2️⃣ Tenta localizar pela descrição (case-insensitive)
  found = await Status.findOne({
    where: sequelize.where(
      sequelize.fn('upper', sequelize.col('descricao')),
      descricao
    ),
    transaction,
  });
  if (found) {
    console.log(`✅ Status "${descricao}" já existe (por descrição) com ID ${found.id}.`);
    return found;
  }

  // 3️⃣ Cria o registro com ID fixo
  const created = await Status.create({ id, descricao }, { transaction });
  console.log(`🆕 Criado status ID ${id}: "${descricao}".`);
  return created;
}

async function fixPgSequence(transaction) {
  const sql = `
    SELECT setval(
      pg_get_serial_sequence('public.status','id'),
      COALESCE((SELECT MAX(id) FROM public.status), 1),
      true
    )
  `;
  await sequelize.query(sql, { transaction });
  console.log('🔧 Sequence de public.status ajustada para MAX(id).');
}

async function run() {
  console.log('🔌 Conectando no banco…');
  await sequelize.authenticate();
  console.log('✅ Autenticado no banco.');

  const transaction = await sequelize.transaction();
  try {
    const essenciais = [
      { id: 7, descricao: 'CANCELADO' },
      { id: 8, descricao: 'AJUSTE' },
    ];

    for (const st of essenciais) {
      await ensureStatus(st, transaction);
    }

    await fixPgSequence(transaction);
    await transaction.commit();
    console.log('🎉 seedStatusExtras (V1): finalizado com sucesso.');
  } catch (err) {
    await transaction.rollback();
    console.error('❌ Erro no seedStatusExtras (V1):', err);
    process.exitCode = 1;
  }
}

// Só executa se rodar via terminal: `node seeders/seedStatusExtras.js`
if (require.main === module) {
  run().then(() => process.exit());
}

module.exports = { run };
