const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Servicos = require('./Servicos');
const CondicaoDePagamento = require('./CondicaoDePagamento');
const MeioDePagamento = require('./MeioDePagamento');
const Racas = require('./Racas');
const Pets = require('./Pets');
const Status = require('./Status');

const TabelaDePrecos = sequelize.define('TabelaDePrecos', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  servicoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Servicos,
      key: 'id',
    }
  },
  condicaoDePagamentoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: CondicaoDePagamento,
      key: 'id',
    }
  },
  meioDePagamentoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: MeioDePagamento,
      key: 'id',
    }
  },
  racaId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Racas,
      key: 'id',
    }
  },
  petId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Pets,
      key: 'id',
    }
  },
  valorServico: {
    type: DataTypes.DECIMAL(10, 2),
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
  tableName: 'tabeladeprecos',
  timestamps: true,
  paranoid: true,
  validate: {
    apenasPetOuRaca() {
      if (!this.petId && !this.racaId) {
        throw new Error('Informe petId ou racaId.');
      }
      if (this.petId && this.racaId) {
        throw new Error('Informe apenas petId OU racaId, não ambos.');
      }
    }
  }
});

module.exports = TabelaDePrecos;
