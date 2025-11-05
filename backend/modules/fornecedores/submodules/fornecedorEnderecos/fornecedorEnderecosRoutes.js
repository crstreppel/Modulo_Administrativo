/* =============================================================
 * Routes: fornecedorEnderecosRoutes.js
 * -------------------------------------------------------------
 * Gerado automaticamente pelo PBQE-C Generator v2.6.1
 * ============================================================= */
const express = require('express');
const router = express.Router();
const controller = require('./fornecedorEnderecosController');

router.post('/', controller.criar);
router.get('/', controller.listar);
router.put('/:id', controller.atualizar);
router.delete('/:id', controller.excluir);

module.exports = router;
