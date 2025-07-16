const { sequelize } = require('../config/db');
const Especie = require('../models/Especie');
const Status = require('../models/Status');

async function popularEspecies() {
  try {
    console.log('🔄 Iniciando população da tabela Especie...');

    // 1. Verifica conexão e sincroniza
    await sequelize.authenticate();
    await Especie.sync({ alter: true });

    // 2. Busca o status ATIVO (ID 1)
    const statusAtivo = await Status.findByPk(1);
    if (!statusAtivo) {
      throw new Error('❌ Status ATIVO (ID 1) não encontrado. Execute popular_tab_status.js primeiro!');
    }

    // 3. Dados iniciais de espécies
    const especies = [
      { id: 1, descricao: 'CANINA', statusId: statusAtivo.id },
      { id: 2, descricao: 'FELINA', statusId: statusAtivo.id },
      { id: 3, descricao: 'EQUINA', statusId: statusAtivo.id }
    ];

    // 4. Inserção com bulkCreate
    const result = await Especie.bulkCreate(especies, {
      updateOnDuplicate: ['descricao', 'statusId'],
      validate: true
    });

    console.log(`📊 ${result.length} espécies inseridas/atualizadas com sucesso.`);
    return true;

  } catch (error) {
    console.error('❌ Erro ao popular espécies:', error.message);
    throw error;
  }
}

module.exports = popularEspecies;
