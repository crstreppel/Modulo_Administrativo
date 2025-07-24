const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Clientes = require('./Clientes');
const Pets = require('./Pets');

const Adiantamento = sequelize.define('Adiantamento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  clienteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Clientes,
      key: 'id',
    }
  },
  petId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Pets,
      key: 'id',
    }
  },
  valorTotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  saldoAtual: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  dataPagamento: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'ativo',
  }
}, {
  tableName: 'adiantamentos',
  timestamps: true,
  paranoid: true,
});

module.exports = Adiantamento;
