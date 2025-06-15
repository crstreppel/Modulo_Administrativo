const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Clientes = require('./Clientes');
const Pets = require('./Pets');
const Servicos = require('./Servicos');
const CondicaoPagamento = require('./CondicaoDePagamento');
const MeioPagamento = require('./MeioDePagamento');
const Status = require('./Status');

const Movimentos = sequelize.define('Movimentos', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  data_lancamento: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  data_movimento: {
    type: DataTypes.DATEONLY,
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
  petId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Pets,
      key: 'id',
    }
  },
  servicoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Servicos,
      key: 'id',
    }
  },
  valor: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  condicaoPagamentoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: CondicaoPagamento,
      key: 'id',
    }
  },
  meioPagamentoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: MeioPagamento,
      key: 'id',
    }
  },
  data_vencimento: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  data_liquidacao: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  observacao: {
    type: DataTypes.STRING(300),
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
  tableName: 'movimentos',
  timestamps: true,
  paranoid: true,
});

module.exports = Movimentos;
