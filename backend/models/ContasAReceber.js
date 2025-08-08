const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Clientes = require('./Clientes');
const Movimentos = require('./Movimentos');
const Status = require('./Status');

const ContasAReceber = sequelize.define('ContasAReceber', {
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
    },
  },
  nomeContato: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  telefoneContato: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  movimentoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Movimentos,
      key: 'id',
    },
  },
  dataVencimento: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  dataPagamento: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  valorOriginal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  valorPago: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  statusId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Status,
      key: 'id',
    },
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  tableName: 'contas_a_receber',
  timestamps: true,
  paranoid: true,
});

module.exports = ContasAReceber;
