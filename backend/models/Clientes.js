const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Status = require('./Status');

const Clientes = sequelize.define('Clientes', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  telefone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING
  },
  cpf: {
    type: DataTypes.STRING
  },
  cnpj: {
    type: DataTypes.STRING
  },
  endereco: {
    type: DataTypes.STRING
  },
  numero: {
    type: DataTypes.STRING
  },
  bairro: {
    type: DataTypes.STRING
  },
  cep: {
    type: DataTypes.STRING
  },
  cidade: {
    type: DataTypes.STRING,
    defaultValue: 'Igrejinha'
  },
  estado: {
    type: DataTypes.STRING,
    defaultValue: 'RS'
  },
  pais: {
    type: DataTypes.STRING,
    defaultValue: 'Brasil'
  },
  complemento: {
    type: DataTypes.STRING
  },
  tipoCliente: {
    type: DataTypes.STRING
  },
  clienteEsporadico: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  statusId: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false,
    references: {
      model: Status,
      key: 'id'
    }
  }
}, {
  paranoid: true,
  tableName: 'clientes'
});

module.exports = Clientes;
