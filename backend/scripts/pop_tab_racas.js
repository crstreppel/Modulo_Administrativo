const { sequelize } = require('../config/db');
const Racas = require('../models/Racas');
const Status = require('../models/Status');

async function popularRacas() {
  try {
    console.log('🔄 Iniciando população da tabela Racas...');

    // 1. Verifica conexão e sincroniza
    await sequelize.authenticate();
    await Racas.sync({ alter: true });

    // 2. Busca o status ATIVO (ID 1)
    const statusAtivo = await Status.findByPk(1);
    if (!statusAtivo) {
      throw new Error('❌ Status ATIVO (ID 1) não encontrado. Execute popular_tab_status.js primeiro!');
    }

    // 3. Dados iniciais de raças caninas (especieId = 1)
    const racas = [
      { id: 1, descricao: 'SRD', especieId: 1, statusId: statusAtivo.id },
      { id: 2, descricao: 'Shih Tzu', especieId: 1, statusId: statusAtivo.id },
      { id: 3, descricao: 'Pug', especieId: 1, statusId: statusAtivo.id },
      { id: 4, descricao: 'Poodle', especieId: 1, statusId: statusAtivo.id },
      { id: 5, descricao: 'Lulu da Pomerânia', especieId: 1, statusId: statusAtivo.id },
      { id: 6, descricao: 'Pastor Alemão', especieId: 1, statusId: statusAtivo.id },
      { id: 7, descricao: 'Collie', especieId: 1, statusId: statusAtivo.id },
      { id: 8, descricao: 'Border Collie', especieId: 1, statusId: statusAtivo.id },
      { id: 9, descricao: 'Pinscher', especieId: 1, statusId: statusAtivo.id }
    ];

    // 4. Inserção com bulkCreate
    const result = await Racas.bulkCreate(racas, {
      updateOnDuplicate: ['descricao', 'especieId', 'statusId'],
      validate: true
    });

    console.log(`📊 ${result.length} raças inseridas/atualizadas com sucesso.`);
    return true;

  } catch (error) {
    console.error('❌ Erro ao popular raças:', error.message);
    throw error;
  }
}

module.exports = popularRacas;
