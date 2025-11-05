/* =============================================================
 * Model: fornecedorEnderecosModel.js
 * -------------------------------------------------------------
 * Gerado automaticamente pelo PBQE-C Generator v2.6.1
 * ============================================================= */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../../config/db'); // ajuste fixo

const FornecedorEnderecos = sequelize.define('FornecedorEnderecos', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  fornecedorId: { type: DataTypes.INTEGER, allowNull: false },
  
  logradouro: { type: DataTypes.STRING(150), allowNull: false },
  numero: { type: DataTypes.STRING(10), allowNull: true },
  complemento: { type: DataTypes.STRING(60), allowNull: true },
  bairro: { type: DataTypes.STRING(100), allowNull: true },
  cidade: { type: DataTypes.STRING(100), allowNull: false },
  estado: { type: DataTypes.CHAR(2), allowNull: false },
  cep: { type: DataTypes.STRING(10), allowNull: true },
  tipoEndereco: { type: DataTypes.STRING(30), allowNull: true }, // ex: residencial, comercial, entrega
  referencia: { type: DataTypes.STRING(150), allowNull: true }, // ponto de referência, condomínio, torre, etc.
  observacoes: { type: DataTypes.TEXT, allowNull: true },
  
  statusId: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  deletedAt: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'fornecedor_enderecos',
  paranoid: true,
  timestamps: true
});

module.exports = FornecedorEnderecos;
