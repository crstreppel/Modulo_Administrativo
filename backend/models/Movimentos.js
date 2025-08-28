// models/Movimentos.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Clientes = require('./Clientes');
const Pets = require('./Pets');
const Servicos = require('./Servicos');
const CondicaoPagamento = require('./CondicaoDePagamento');
const MeioPagamento = require('./MeioDePagamento');
const Status = require('./Status');
const TabelaDePrecos = require('./TabelaDePrecos');
const Adiantamentos = require('./Adiantamento');

const Movimentos = sequelize.define('Movimentos', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  // Sempre “hoje” no servidor/DB. Imutável após criado.
  data_lancamento: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: sequelize.literal('CURRENT_DATE'),
    validate: { isDate: true },
  },

  // Data real do evento (retroativa ok). Se não vier, cai em hoje no DB.
  data_movimento: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: sequelize.literal('CURRENT_DATE'),
    validate: { isDate: true },
  },

  clienteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Clientes, key: 'id' },
  },

  petId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Pets, key: 'id' },
  },

  servicoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Servicos, key: 'id' },
  },

  tabelaDePrecosId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: TabelaDePrecos, key: 'id' },
  },

  valor: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },

  condicaoPagamentoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: CondicaoPagamento, key: 'id' },
  },

  meioPagamentoId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: MeioPagamento, key: 'id' },
  },

  // Para cond=1/3, liquida automaticamente = data_movimento (controller)
  data_liquidacao: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: { isDate: true },
  },

  observacao: {
    type: DataTypes.STRING(300),
    allowNull: true,
  },

  statusId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Status, key: 'id' },
  },

  adiantamentoId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: Adiantamentos, key: 'id' },
  },
}, {
  tableName: 'movimentos',
  timestamps: true,
  paranoid: true,
  hooks: {
    // Imutável: não deixa alterar data_lancamento
    beforeUpdate: (mov) => {
      if (mov.changed('data_lancamento')) {
        mov.set('data_lancamento', mov._previousDataValues.data_lancamento);
      }
    },
    // Segurança extra: força CURRENT_DATE no insert do lançamento
    beforeCreate: (mov) => {
      mov.set('data_lancamento', sequelize.literal('CURRENT_DATE'));
      // Se ninguém setou data_movimento, deixa no CURRENT_DATE do DB
      if (!mov.get('data_movimento')) {
        mov.set('data_movimento', sequelize.literal('CURRENT_DATE'));
      }
    },
  },
});

module.exports = Movimentos;
