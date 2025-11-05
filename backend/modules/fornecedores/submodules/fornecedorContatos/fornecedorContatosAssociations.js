// backend/modules/fornecedores/submodules/fornecedorContatos/fornecedorContatosAssociations.js
// =============================================================
// 📦 Submódulo: FornecedorContatos
// 🧱 Padrão: PBQE-C™ v2.6.3 — Estrutura Integrada e Consistente
// 🔧 Responsáveis: Claudião (arquitetura) & Bruxão (execução)
// =============================================================
//
// 🧩 Função:
// Define os relacionamentos Sequelize do submódulo FornecedorContatos
// com o módulo-pai (Fornecedor) e o módulo Status.
// =============================================================

const FornecedorContato = require('./fornecedorContatosModel');
const Fornecedor = require('../../../fornecedorModel');
const Status = require('../../../../models/Status');

// -------------------------------------------------------------
// 🔗 Associação com o módulo-pai (Fornecedor)
// -------------------------------------------------------------
Fornecedor.hasMany(FornecedorContato, {
  foreignKey: 'fornecedorId',
  as: 'contatos'
});
FornecedorContato.belongsTo(Fornecedor, {
  foreignKey: 'fornecedorId',
  as: 'fornecedor'
});

// -------------------------------------------------------------
// ⚙️ Associação com o módulo Status
// -------------------------------------------------------------
Status.hasMany(FornecedorContato, { foreignKey: 'statusId' });
FornecedorContato.belongsTo(Status, { foreignKey: 'statusId' });

// -------------------------------------------------------------
// ✅ Exportação
// -------------------------------------------------------------
console.log('🔗 [PBQE-C v2.6.3] Associações do submódulo FornecedorContatos aplicadas com sucesso.');

module.exports = { FornecedorContato };
