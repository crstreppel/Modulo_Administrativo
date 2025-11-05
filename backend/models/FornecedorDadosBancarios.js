// models/FornecedorDadosBancarios.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Fornecedores = require('./Fornecedor');

const FornecedorDadosBancarios = sequelize.define('FornecedorDadosBancarios', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  fornecedorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Fornecedores, key: 'id' },
  },

  banco: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },

  agencia: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },

  conta: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },

  pix: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },

  tipoConta: {
    type: DataTypes.ENUM('Corrente', 'Poupança', 'Outro'),
    allowNull: false,
    defaultValue: 'Corrente',
  },

  principal: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },

  observacao: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

}, {
  tableName: 'fornecedor_dados_bancarios',
  timestamps: true,
  paranoid: true,
  hooks: {
    beforeUpdate: (banco) => {
      if (banco.changed('fornecedorId')) {
        banco.set('fornecedorId', banco._previousDataValues.fornecedorId);
      }
    },
  },
});

module.exports = FornecedorDadosBancarios;
