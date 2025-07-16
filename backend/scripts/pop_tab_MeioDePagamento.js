const { sequelize } = require('../config/db');
const MeioDePagamento = require('../models/MeioDePagamento');
const Status = require('../models/Status');

async function popularMeiosDePagamento() {
  try {
    console.log('🔄 Iniciando população da tabela Meio_de_pagamento...');

    // 1. Verifica conexão e sincroniza
    await sequelize.authenticate();
    await MeioDePagamento.sync({ alter: true });

    // 2. Busca o status ATIVO (ID 1)
    const statusAtivo = await Status.findByPk(1);
    if (!statusAtivo) {
      throw new Error('❌ Status ATIVO (ID 1) não encontrado. Execute popular_tab_status.js primeiro!');
    }

    // 3. Dados iniciais de meios de pagamento
    const meios = [
      { id: 1, descricao: 'DINHEIRO', statusId: statusAtivo.id },
      { id: 2, descricao: 'PIX', statusId: statusAtivo.id },
      { id: 3, descricao: 'ADIANTAMENTO', statusId: statusAtivo.id },
      { id: 4, descricao: 'BOLETO', statusId: statusAtivo.id },
      { id: 5, descricao: 'CARTÃO DE CRÉDITO', statusId: statusAtivo.id },
      { id: 6, descricao: 'CARTÃO DE DÉBITO', statusId: statusAtivo.id }
    ];

    // 4. Inserção com bulkCreate
    const result = await MeioDePagamento.bulkCreate(meios, {
      updateOnDuplicate: ['descricao', 'statusId'],
      validate: true
    });

    console.log(`📊 ${result.length} meios de pagamento inseridos/atualizados com sucesso.`);
    return true;

  } catch (error) {
    console.error('❌ Erro ao popular meios de pagamento:', error.message);
    throw error;
  }
}

module.exports = popularMeiosDePagamento;
