const { sequelize } = require('../config/db');
const CondicaoDePagamento = require('../models/CondicaoDePagamento');
const Status = require('../models/Status');

async function popularCondicoesDePagamento() {
  try {
    console.log('🔄 Iniciando população da tabela CondicaoDePagamento...');

    // 1. Verifica conexão e sincroniza
    await sequelize.authenticate();
    await CondicaoDePagamento.sync({ alter: true });

    // 2. Busca o status ATIVO (ID 1)
    const statusAtivo = await Status.findByPk(1);
    if (!statusAtivo) {
      throw new Error('❌ Status ATIVO (ID 1) não encontrado. Execute popular_tab_status.js primeiro!');
    }

    // 3. Dados iniciais de condições de pagamento
    const condicoes = [
      { id: 1, descricao: 'A VISTA', statusId: statusAtivo.id },
      { id: 2, descricao: '7 DIAS', statusId: statusAtivo.id },
      { id: 3, descricao: 'ADIANTAMENTO', statusId: statusAtivo.id },
      { id: 4, descricao: '14 DIAS', statusId: statusAtivo.id },
      { id: 5, descricao: '30 DIAS', statusId: statusAtivo.id },
      { id: 6, descricao: '15,30 DIAS', statusId: statusAtivo.id },
      { id: 7, descricao: '15,30,45 DIAS', statusId: statusAtivo.id }

    ];

    // 4. Inserção com bulkCreate
    const result = await CondicaoDePagamento.bulkCreate(condicoes, {
      updateOnDuplicate: ['descricao', 'statusId'],
      validate: true
    });

    console.log(`📊 ${result.length} condições de pagamento inseridas/atualizadas com sucesso.`);
    return true;

  } catch (error) {
    console.error('❌ Erro ao popular condições de pagamento:', error.message);
    throw error;
  }
}

module.exports = popularCondicoesDePagamento;
