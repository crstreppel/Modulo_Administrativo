// models/FornecedorCategorias.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const FornecedorCategorias = sequelize.define('FornecedorCategorias', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  descricao: {
    type: DataTypes.STRING(80),
    allowNull: false,
  },

  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },

}, {
  tableName: 'fornecedor_categorias',
  timestamps: true,
  paranoid: true,
});

module.exports = FornecedorCategorias;
