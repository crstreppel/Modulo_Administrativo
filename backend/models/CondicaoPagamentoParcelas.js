const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CondicaoDePagamento = require('./CondicaoDePagamento');

const CondicaoPagamentoParcelas = sequelize.define('CondicaoPagamentoParcelas', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  condicaoPagamentoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'condicao_de_pagamento', // nome da tabela no banco
      key: 'id',
    },
    field: 'condicao_pagamento_id'
  },
  numero_parcela: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  dias_para_pagamento: {
    type: DataTypes.INTEGER,
    allowNull: false,
  }
}, {
  tableName: 'condicao_pagamento_parcelas',
  timestamps: false,
});

CondicaoPagamentoParcelas.belongsTo(CondicaoDePagamento, {
  foreignKey: 'condicaoPagamentoId',
  as: 'condicaoDePagamento'
});

module.exports = CondicaoPagamentoParcelas;
