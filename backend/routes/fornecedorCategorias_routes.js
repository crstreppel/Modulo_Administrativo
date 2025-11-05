// routes/fornecedorCategorias_routes.js
const express = require('express');
const router = express.Router();
const fornecedorCategoriasController = require('../controllers/fornecedorCategoriasController');

router.get('/', fornecedorCategoriasController.listar);
router.get('/:id', fornecedorCategoriasController.buscarPorId);
router.post('/', fornecedorCategoriasController.criar);
router.put('/:id', fornecedorCategoriasController.atualizar);
router.delete('/:id', fornecedorCategoriasController.excluir);

module.exports = router;
