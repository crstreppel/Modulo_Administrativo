// models/FornecedorEnderecos.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Fornecedores = require('./Fornecedor');

const FornecedorEnderecos = sequelize.define('FornecedorEnderecos', {
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

  cep: {
    type: DataTypes.STRING(9),
    allowNull: true,
  },

  logradouro: {
    type: DataTypes.STRING(120),
    allowNull: true,
  },

  numero: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },

  bairro: {
    type: DataTypes.STRING(80),
    allowNull: true,
  },

  cidade: {
    type: DataTypes.STRING(80),
    allowNull: true,
  },

  uf: {
    type: DataTypes.STRING(2),
    allowNull: true,
  },

  complemento: {
    type: DataTypes.STRING(80),
    allowNull: true,
  },

  tipoEndereco: {
    type: DataTypes.ENUM('Principal', 'Entrega', 'Cobranca', 'Antigo'),
    allowNull: false,
    defaultValue: 'Principal',
  },

  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },

}, {
  tableName: 'fornecedor_enderecos',
  timestamps: true,
  paranoid: true,
  hooks: {
    beforeUpdate: (end) => {
      if (end.changed('fornecedorId')) {
        end.set('fornecedorId', end._previousDataValues.fornecedorId);
      }
    },
  },
});

module.exports = FornecedorEnderecos;
