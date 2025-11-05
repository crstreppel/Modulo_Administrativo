// routes/fornecedorAvaliacoes_routes.js
const express = require('express');
const router = express.Router();
const fornecedorAvaliacoesController = require('../controllers/fornecedorAvaliacoesController');

router.get('/', fornecedorAvaliacoesController.listar);
router.post('/', fornecedorAvaliacoesController.criar);
router.delete('/:id', fornecedorAvaliacoesController.excluir);

module.exports = router;

