// v1.2 - Padrão Bruxão V1 • Seed Status
// Executa com: `node seeders/seedStatus.js`
// Cria os status padrão do sistema

const { sequelize } = require('../config/db');
const Status = require('../models/Status');

async function run() {
  try {
    console.log('🔌 Conectando ao banco...');
    await sequelize.authenticate();
    console.log('✅ Conectado.');

    const statusData = [
      { descricao: 'ativo' },
      { descricao: 'inativo' },
      { descricao: 'bloqueado' },
      { descricao: 'pendente' },
      { descricao: 'cancelado' },
    ];

    for (const s of statusData) {
      const [reg, created] = await Status.findOrCreate({
        where: { descricao: s.descricao },
        defaults: s,
      });
      console.log(
        created ? `➕ Status criado: ${s.descricao}` : `✔️ Status já existe: ${s.descricao}`
      );
    }

    console.log('🏁 Seed de Status concluído com sucesso!');
  } catch (err) {
    console.error('❌ Erro no seed de status:', err);
    throw err;
  } finally {
    await sequelize.close();
  }
}

// Só executa se rodar via terminal
if (require.main === module) {
  run().catch(() => process.exit(1));
}

module.exports = { run };
