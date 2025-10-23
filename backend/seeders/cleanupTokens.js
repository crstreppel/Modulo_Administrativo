// v1.3 - Padrão Bruxão V1 • Limpeza de RefreshTokens expirados ou revogados
// Executa manualmente: `node seeders/cleanupTokens.js`
// Pode ser agendado via PM2/cron para rodar diariamente

const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const { DataTypes } = require('sequelize');
const RefreshToken = require('../models/RefreshToken')(sequelize, DataTypes);

async function run() {
  try {
    console.log('🧹 Iniciando limpeza de refresh tokens...');
    const agora = new Date();

    const where = {
      [Op.or]: [
        { expiresAt: { [Op.lte]: agora } },
        { revokedAt: { [Op.ne]: null } },
      ],
    };

    const total = await RefreshToken.count({ where });

    if (total > 0) {
      const apagados = await RefreshToken.destroy({ where });
      console.log(`✅ Limpeza concluída: ${apagados} refresh token(s) removido(s).`);
    } else {
      console.log('✔️ Nenhum refresh token para limpar.');
    }

    console.log('🏁 Cleanup concluído com sucesso!');
  } catch (err) {
    console.error('❌ Erro na limpeza de tokens:', err);
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
