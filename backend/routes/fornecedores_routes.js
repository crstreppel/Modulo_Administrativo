// routes/fornecedores_routes.js
const express = require('express');
const router = express.Router();
const fornecedoresController = require('../controllers/fornecedoresController');

// Rotas principais
router.get('/', fornecedoresController.listar);
router.get('/:id', fornecedoresController.buscarPorId);
router.post('/', fornecedoresController.criar);
router.put('/:id', fornecedoresController.atualizar);
router.delete('/:id', fornecedoresController.excluir);

module.exports = router;
