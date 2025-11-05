// routes/fornecedorDadosBancarios_routes.js
const express = require('express');
const router = express.Router();
const fornecedorDadosBancariosController = require('../controllers/fornecedorDadosBancariosController');

router.get('/', fornecedorDadosBancariosController.listar);
router.post('/', fornecedorDadosBancariosController.criar);
router.put('/:id', fornecedorDadosBancariosController.atualizar);
router.delete('/:id', fornecedorDadosBancariosController.excluir);

module.exports = router;
