/* =============================================================
 * Associations: fornecedorEnderecosAssociations.js
 * -------------------------------------------------------------
 * Gerado automaticamente pelo PBQE-C Generator v2.6.1
 * ============================================================= */
const FornecedorEnderecos = require('./fornecedorEnderecosModel');
const Fornecedor = require('../../fornecedorModel');
const Status = require('../../../../models/Status');

Fornecedor.hasMany(FornecedorEnderecos, { foreignKey: 'fornecedorId' });
FornecedorEnderecos.belongsTo(Fornecedor, { foreignKey: 'fornecedorId' });

Status.hasMany(FornecedorEnderecos, { foreignKey: 'statusId' });
FornecedorEnderecos.belongsTo(Status, { foreignKey: 'statusId' });

module.exports = { FornecedorEnderecos };
