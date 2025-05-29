const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Status = require('./Status');
const Clientes = require('./Clientes');
const Especie = require('./Especie');
const Racas = require('./Racas');

const Pets = sequelize.define('Pets', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  clienteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Clientes,
      key: 'id',
    }
  },
  especieId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Especie,
      key: 'id',
    }
  },
  racaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Racas,
      key: 'id',
    }
  },
  foto: {
    type: DataTypes.STRING,
    allowNull: true,
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
  tableName: 'pets',
  timestamps: true,
  paranoid: true,
});

module.exports = Pets;
