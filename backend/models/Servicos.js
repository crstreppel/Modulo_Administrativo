const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Status = require('./Status');

const Servicos = sequelize.define('Servicos', {
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
      model: Status, // ← Correção aqui
      key: 'id',
    }
  }
}, {
  tableName: 'servicos',
  timestamps: true,
  paranoid: true,
});

module.exports = Servicos;
