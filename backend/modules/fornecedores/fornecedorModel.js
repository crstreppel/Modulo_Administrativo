/* =============================================================
 * 🧙‍♂️ fornecedorModel.js • PBQE-C Universal v2.6.4
 * -------------------------------------------------------------
 * - Estrutura compatível com Sequelize + PostgreSQL
 * - Campos padrão PBQE-C Universal incluídos
 * - Require explícito corrigido (padrão V1 preservado)
 * - Log e validação humanizada prontos para integração
 * ============================================================= */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db'); // ✅ require explícito corrigido

const Fornecedor = sequelize.define('Fornecedor', {
  // -------------------------------------------------------------
  // 🔑 Identificação primária
  // -------------------------------------------------------------
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  // -------------------------------------------------------------
  // 🏢 Dados cadastrais principais
  // -------------------------------------------------------------
  tipoPessoa: {
    type: DataTypes.STRING(1), // F = Física / J = Jurídica
    allowNull: false,
    comment: 'Tipo de pessoa: F ou J'
  },

  razaoSocial: {
    type: DataTypes.STRING(150),
    allowNull: false,
    comment: 'Nome completo ou razão social'
  },

  nomeFantasia: {
    type: DataTypes.STRING(150),
    allowNull: true,
    comment: 'Nome fantasia ou apelido comercial'
  },

  cpfCnpj: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: 'CPF ou CNPJ do fornecedor'
  },

  inscricaoEstadual: {
    type: DataTypes.STRING(30),
    allowNull: true
  },

  emailPrincipal: {
    type: DataTypes.STRING(150),
    allowNull: true
  },

  telefonePrincipal: {
    type: DataTypes.STRING(20),
    allowNull: true
  },

  tipoFornecedor: {
    type: DataTypes.ENUM('Produto', 'Serviço', 'Ambos'),
    allowNull: false,
    defaultValue: 'Produto',
    comment: 'Define se o fornecedor entrega produtos, serviços ou ambos'
  },

  // -------------------------------------------------------------
  // 📊 Dados operacionais (corrigido)
  // -------------------------------------------------------------
  scoreAtual: {
    type: DataTypes.DECIMAL(5, 2), // ✅ antes era (3,2) — erro corrigido
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Pontuação atual do fornecedor (0.00 a 100.00)'
  },

  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  // -------------------------------------------------------------
  // ⚙️ Controle sistêmico PBQE-C Universal – Dupla Combinação™
  // -------------------------------------------------------------
  statusId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Chave estrangeira referenciando status'
  },

  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Define se o registro está ativo (soft delete controlado)'
  },

  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Registro de exclusão lógica (soft delete)'
  },

  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },

  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
},
{
  paranoid: true, // ativa soft delete nativo do Sequelize
  timestamps: true,
  freezeTableName: true,
  tableName: 'fornecedores',
  comment: 'Cadastro de fornecedores – módulo PBQE-C Universal'
});

module.exports = Fornecedor;
