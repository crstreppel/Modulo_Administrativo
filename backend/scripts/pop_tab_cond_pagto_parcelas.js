const { sequelize } = require('../config/db');
const CondicaoPagamentoParcelas = require('../models/CondicaoPagamentoParcelas');

async function popularParcelasCondicaoPagamento() {
  try {
    console.log('🔄 Iniciando população da tabela CondicaoPagamentoParcelas...');

    await sequelize.authenticate();
    await CondicaoPagamentoParcelas.sync({ alter: true });

    const parcelas = [
      { id: 1, condicaoPagamentoId: 2, numero_parcela: 1, dias_para_pagamento: 7 },
      { id: 2, condicaoPagamentoId: 4, numero_parcela: 1, dias_para_pagamento: 14 },
      { id: 3, condicaoPagamentoId: 5, numero_parcela: 1, dias_para_pagamento: 30 },
      { id: 4, condicaoPagamentoId: 6, numero_parcela: 1, dias_para_pagamento: 15 },
      { id: 5, condicaoPagamentoId: 6, numero_parcela: 2, dias_para_pagamento: 30 },
      { id: 6, condicaoPagamentoId: 7, numero_parcela: 1, dias_para_pagamento: 15 },
      { id: 7, condicaoPagamentoId: 7, numero_parcela: 2, dias_para_pagamento: 30 },
      { id: 8, condicaoPagamentoId: 7, numero_parcela: 3, dias_para_pagamento: 45 }
    ];

    const result = await CondicaoPagamentoParcelas.bulkCreate(parcelas, {
      updateOnDuplicate: ['dias_para_pagamento'],
      validate: true
    });

    console.log(`📦 ${result.length} registros de parcelas inseridos/atualizados com sucesso.`);
    return true;

  } catch (error) {
    console.error('❌ Erro ao popular parcelas da condição de pagamento:', error.message);
    throw error;
  }
}

module.exports = popularParcelasCondicaoPagamento;
