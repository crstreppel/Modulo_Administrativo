// backend/modules/fornecedores/fornecedorRoutes.js
// =============================================================
// 📦 Módulo: Fornecedores
// 🧱 Padrão: PBQE-C™ v2.6.3 — Estrutura Modular Hierárquica
// 🔧 Responsáveis: Claudião (arquitetura) & Bruxão (execução)
// =============================================================

const express = require('express');
const router = express.Router();
const fornecedorController = require('./fornecedorController');

// -------------------------------------------------------------
// 🧩 Submódulos — (endereços, contatos, anexos, etc.)
// -------------------------------------------------------------
// ⚠️ Regras PBQE-C v2.6.3:
// - Submódulos SEMPRE antes das rotas /:id
// - Caminhos explícitos e isolados
// -------------------------------------------------------------

try {
  const fornecedorEnderecosRoutes = require('./submodules/fornecedorEnderecos/fornecedorEnderecosRoutes');
  router.use('/enderecos', fornecedorEnderecosRoutes);
  console.log('🧱 [PBQE-C] Submódulo /enderecos carregado.');
} catch {
  console.log('⚠️ [PBQE-C] Submódulo /enderecos não encontrado (modo parcial).');
}

// Futuro: outros submódulos plug-and-play
// try {
//   const fornecedorContatosRoutes = require('./submodules/fornecedorContatos/fornecedorContatosRoutes');
//   router.use('/contatos', fornecedorContatosRoutes);
// } catch {
//   console.log('⚠️ [PBQE-C] Submódulo /contatos não encontrado.');
// }

// =============================================================
// 🌐 Rotas principais do módulo Fornecedores
// -------------------------------------------------------------
// Observação PBQE-C:
// As rotas genéricas (/:id) devem vir *após* os submódulos
// para evitar conflitos de path.
// =============================================================
router.get('/', fornecedorController.listar);
router.get('/:id', fornecedorController.buscarPorId);
router.post('/', fornecedorController.criar);
router.put('/:id', fornecedorController.atualizar);
router.delete('/:id', fornecedorController.excluir);

// =============================================================
// ✅ Exportação do Router
// =============================================================
module.exports = router;

console.log('✅ [PBQE-C v2.6.3] Rotas do módulo Fornecedores carregadas com sucesso.');
