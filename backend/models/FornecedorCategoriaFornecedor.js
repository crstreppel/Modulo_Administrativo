// models/FornecedorCategoriaFornecedor.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Fornecedores = require('./Fornecedor');
const FornecedorCategorias = require('./FornecedorCategorias');

const FornecedorCategoriaFornecedor = sequelize.define('FornecedorCategoriaFornecedor', {
  fornecedorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Fornecedores, key: 'id' },
  },

  categoriaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: FornecedorCategorias, key: 'id' },
  },

}, {
  tableName: 'fornecedor_categoria_fornecedor',
  timestamps: true,
  paranoid: true,
});

module.exports = FornecedorCategoriaFornecedor;
