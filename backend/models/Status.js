// backend/models/Status.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Status = sequelize.define('Status', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  descricao: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {
  tableName: 'status',
  timestamps: true,
  paranoid: true, // habilita soft delete
});

module.exports = Status;
