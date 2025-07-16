const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Status = require('./Status');

const Clientes = sequelize.define('Clientes', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  telefone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  endereco: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  numero: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  bairro: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  cidade: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  estado: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  pais: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  cpf: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  redesSociais: {
    type: DataTypes.ARRAY(DataTypes.STRING), // PostgreSQL nativo aceita array
    allowNull: true,
  },
  aceitaLembreteBanho: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  link_maps: {
    type: DataTypes.STRING,
    allowNull: true, // Pode ser nulo se não for gerado no momento do cadastro
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
  tableName: 'clientes',
  timestamps: true,
  paranoid: true,
});

module.exports = Clientes;
