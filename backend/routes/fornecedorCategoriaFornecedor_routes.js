// routes/fornecedorCategoriaFornecedor_routes.js
const express = require('express');
const router = express.Router();
const fornecedorCategoriaFornecedorController = require('../controllers/fornecedorCategoriaFornecedorController');

router.get('/', fornecedorCategoriaFornecedorController.listar);
router.post('/', fornecedorCategoriaFornecedorController.criar);
router.delete('/', fornecedorCategoriaFornecedorController.excluir);

module.exports = router;
