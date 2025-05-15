const { sequelize } = require('../config/db');
const Racas = require('../models/Racas');
const Status = require('../models/Status');

async function popularRacas() {
  try {
    console.log('🔄 Iniciando população da tabela Racas...');

    // 1. Verifica conexão e sincroniza a tabela Racas
    await sequelize.authenticate();
    await Racas.sync({ alter: true });

    // 2. Busca o status ATIVO (ID 1)
    const statusAtivo = await Status.findByPk(1);
    if (!statusAtivo) {
      throw new Error('❌ Status ATIVO (ID 1) não encontrado. Execute primeiro o script popular_tab_status.js.');
    }

    // 3. Lista de raças a serem inseridas
    const racas = [
      { id: 1, descricao: 'Poodle', statusId: statusAtivo.id },
      { id: 2, descricao: 'Labrador', statusId: statusAtivo.id },
      { id: 3, descricao: 'Bulldog', statusId: statusAtivo.id },
      { id: 4, descricao: 'Golden Retriever', statusId: statusAtivo.id },
      { id: 5, descricao: 'Pastor Alemão', statusId: statusAtivo.id }
    ];

    // 4. Inserção com updateOnDuplicate
    const result = await Racas.bulkCreate(racas, {
      updateOnDuplicate: ['descricao', 'statusId'],
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
