const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Status = require('./Status');
const Especie = require('./Especie');

const Racas = sequelize.define('Racas', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  descricao: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  statusId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Status,
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
  }
}, {
  tableName: 'racas',
  timestamps: true,
  paranoid: true,
});

module.exports = Racas;
