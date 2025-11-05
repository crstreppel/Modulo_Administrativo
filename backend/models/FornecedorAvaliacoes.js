// models/FornecedorAvaliacoes.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Fornecedores = require('./Fornecedor');

const FornecedorAvaliacoes = sequelize.define('FornecedorAvaliacoes', {
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

  criterio: {
    type: DataTypes.STRING(80),
    allowNull: false,
  },

  nota: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
  },

  comentario: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  avaliadoPor: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },

}, {
  tableName: 'fornecedor_avaliacoes',
  timestamps: true,
  paranoid: true,
});

module.exports = FornecedorAvaliacoes;
