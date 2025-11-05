// backend/modules/fornecedores/submodules/fornecedorContatos/fornecedorContatosRoutes.js
// =============================================================
// 📦 Submódulo: FornecedorContatos
// 🧱 Padrão: PBQE-C™ v2.6.3 — Estrutura Hierárquica & Log Unificado
// 🔧 Responsáveis: Claudião (arquitetura) & Bruxão (execução)
// =============================================================
//
// 🧩 Função:
// Define as rotas REST do submódulo FornecedorContatos,
// mantendo o padrão hierárquico do módulo Fornecedores.
// =============================================================

const express = require('express');
const router = express.Router();
const controller = require('./fornecedorContatosController');

// -------------------------------------------------------------
// 🌐 Rotas REST — padrão PBQE-C
// -------------------------------------------------------------
router.get('/', controller.listar);
router.post('/', controller.criar);
router.put('/:id', controller.atualizar);
router.delete('/:id', controller.excluir);

// -------------------------------------------------------------
// ✅ Exportação do Router
// -------------------------------------------------------------
console.log('🧱 [PBQE-C v2.6.3] Rotas do submódulo FornecedorContatos carregadas.');
module.exports = router;
