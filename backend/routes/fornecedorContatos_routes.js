// routes/fornecedorContatos_routes.js
const express = require('express');
const router = express.Router();
const fornecedorContatosController = require('../controllers/fornecedorContatosController');

router.get('/', fornecedorContatosController.listar);
router.post('/', fornecedorContatosController.criar);
router.put('/:id', fornecedorContatosController.atualizar);
router.delete('/:id', fornecedorContatosController.excluir);

module.exports = router;
