// routes/fornecedorEnderecos_routes.js
const express = require('express');
const router = express.Router();
const fornecedorEnderecosController = require('../controllers/fornecedorEnderecosController');

router.get('/', fornecedorEnderecosController.listar);
router.post('/', fornecedorEnderecosController.criar);
router.put('/:id', fornecedorEnderecosController.atualizar);
router.delete('/:id', fornecedorEnderecosController.excluir);

module.exports = router;
