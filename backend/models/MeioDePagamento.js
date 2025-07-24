const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db_dev');
const Status = require('./Status');

const Meio_de_pagamento = sequelize.define('Meio_de_pagamento', {
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
  }
}, {
  tableName: 'meio_de_pagamento',
  timestamps: true,
  paranoid: true,
});

module.exports = Meio_de_pagamento;
