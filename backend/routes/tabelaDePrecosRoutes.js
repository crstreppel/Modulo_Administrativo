const express = require('express');
const router = express.Router();
const tabelaDePrecosController = require('../controllers/TabelaDePrecosController');

// GET: Listar todos os registros de preços
router.get('/', tabelaDePrecosController.listarTabelaDePrecos);

// POST: Criar novo registro de preço
router.post('/', tabelaDePrecosController.criarTabelaDePrecos);

// PUT: Atualizar registro por ID
router.put('/:id', tabelaDePrecosController.atualizarTabelaDePrecos);

// DELETE: Remover registro (soft delete) por ID
router.delete('/:id', tabelaDePrecosController.deletarTabelaDePrecos);

module.exports = router;