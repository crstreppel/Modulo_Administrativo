const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Status = require('./Status');

const CondicaoDePagamento = sequelize.define('CondicaoDePagamento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  descricao: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  statusId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Status,
      key: 'id',
    }
  }
}, {
  tableName: 'condicao_de_pagamento',
  timestamps: true,
  paranoid: true,
});

module.exports = CondicaoDePagamento;
