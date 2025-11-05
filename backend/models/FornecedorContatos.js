// fornecedorContatosModel.js • PBQE-C™ v2-ready
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/db');
const Fornecedor = require('../../fornecedorModel');
const Status = require('../../../models/Status');

const FornecedorContatos = sequelize.define('FornecedorContatos', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  fornecedorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Fornecedor, key: 'id' },
  },

  nome: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },

  cargo: {
    type: DataTypes.STRING(80),
    allowNull: true,
  },

  email: {
    type: DataTypes.STRING(120),
    allowNull: true,
  },

  telefone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },

  celular: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },

  whatsapp: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },

  tipo: {
    type: DataTypes.ENUM('Comercial', 'Financeiro', 'Técnico', 'Representante', 'Outros'),
    allowNull: true,
  },

  principal: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },

  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  statusId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    references: { model: Status, key: 'id' },
  },

  usuarioAtualizacao: {
    type: DataTypes.STRING(80),
    allowNull: true,
  },

  dataAtualizacao: {
    type: DataTypes.DATE,
    allowNull: true,
  },

}, {
  tableName: 'fornecedor_contatos',
  timestamps: true,
  paranoid: true,
  hooks: {
    beforeUpdate: (contato) => {
      // Impede troca de fornecedorId
      if (contato.changed('fornecedorId')) {
        contato.set('fornecedorId', contato._previousDataValues.fornecedorId);
      }
      contato.dataAtualizacao = new Date();
    },
  },
});

module.exports = FornecedorContatos;
