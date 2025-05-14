const { sequelize } = require('../config/db');
const Servicos = require('../models/Servicos');
const Status = require('../models/Status');

async function popularServicos() {
  try {
    console.log('🔄 Iniciando população da tabela Servicos...');

    // 1. Verifica conexão e sincroniza
    await sequelize.authenticate();
    await Servicos.sync({ alter: true });

    // 2. Busca o status ATIVO (usando ID fixo como definido em popular_tab_status.js)
    const statusAtivo = await Status.findByPk(1);
    if (!statusAtivo) {
      throw new Error('❌ Status ATIVO (ID 1) não encontrado. Execute popular_tab_status.js primeiro!');
    }

    // 3. Dados iniciais
    const servicos = [
      { id: 1, descricao: 'BANHO', statusId: statusAtivo.id },
      { id: 2, descricao: 'BANHO E TOSA', statusId: statusAtivo.id },
      { id: 3, descricao: 'HOSPEDAGEM', statusId: statusAtivo.id },
      { id: 4, descricao: 'CRECHE', statusId: statusAtivo.id }
    ];

    // 4. Upsert com bulkCreate para melhor performance
    const result = await Servicos.bulkCreate(servicos, {
      updateOnDuplicate: ['descricao', 'statusId'], // Atualiza se o ID existir
      validate: true
    });

    console.log(`📊 ${result.length} serviços inseridos/atualizados.`);
    return true;

  } catch (error) {
    console.error('❌ Erro crítico:', error.message);
    throw error;
  }
}

module.exports = popularServicos;