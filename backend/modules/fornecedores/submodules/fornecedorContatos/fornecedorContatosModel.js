// backend/modules/fornecedores/submodules/fornecedorContatos/fornecedorContatosModel.js
// =============================================================
// 📦 Submódulo: FornecedorContatos
// 🧱 Padrão: PBQE-C™ v2.6.3 — Estrutura Hierárquica Integrada
// 🔧 Responsáveis: Claudião (arquitetura) & Bruxão (execução)
// =============================================================
//
// 🧩 Função:
// Registra contatos vinculados a fornecedores, mantendo histórico
// e controle de status. Suporte total a Soft Delete (paranoid).
// =============================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../../config/db');

const FornecedorContato = sequelize.define('FornecedorContato', {
  // -------------------------------------------------------------
  // 🔑 Identificação primária
  // -------------------------------------------------------------
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },

  // -------------------------------------------------------------
  // 🔗 Chave estrangeira (fornecedorId)
  // -------------------------------------------------------------
  fornecedorId: { 
    type: DataTypes.INTEGER, 
    allowNull: false, 
    comment: 'FK — fornecedor ao qual o contato pertence' 
  },

  // -------------------------------------------------------------
  // 👤 Dados do contato
  // -------------------------------------------------------------
  nome: { 
    type: DataTypes.STRING(100), 
    allowNull: false 
  },
  telefone: { 
    type: DataTypes.STRING(25), 
    allowNull: true 
  },
  email: { 
    type: DataTypes.STRING(100), 
    allowNull: true 
  },
  cargo: { 
    type: DataTypes.STRING(60), 
    allowNull: true 
  },
  observacoes: { 
    type: DataTypes.TEXT, 
    allowNull: true 
  },

  // -------------------------------------------------------------
  // ⚙️ Controle sistêmico
  // -------------------------------------------------------------
  statusId: { 
    type: DataTypes.INTEGER, 
    allowNull: false, 
    defaultValue: 1 
  },
  deletedAt: { 
    type: DataTypes.DATE, 
    allowNull: true 
  }

}, {
  tableName: 'fornecedor_contatos',
  paranoid: true,
  timestamps: true,
  comment: 'Tabela de contatos associados aos fornecedores'
});

module.exports = FornecedorContato;
