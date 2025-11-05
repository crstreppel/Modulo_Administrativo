// models/FornecedorAnexos.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Fornecedores = require('./Fornecedor');

const FornecedorAnexos = sequelize.define('FornecedorAnexos', {
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

  nomeArquivo: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },

  tipoDocumento: {
    type: DataTypes.STRING(80),
    allowNull: true,
  },

  url: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },

  uploadPor: {
    type: DataTypes.STRING(80),
    allowNull: true,
  },

}, {
  tableName: 'fornecedor_anexos',
  timestamps: true,
  paranoid: true,
});

module.exports = FornecedorAnexos;
