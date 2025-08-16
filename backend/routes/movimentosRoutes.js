const express = require('express');
const router = express.Router();
const movimentosController = require('../controllers/movimentosController');

// GET: Relatório de movimentos (com filtros opcionais)
router.get('/relatorio', movimentosController.relatorioMovimentos);

// GET: Listar todos os movimentos
router.get('/', movimentosController.listarMovimentos);

// POST: Criar novo movimento
router.post('/', movimentosController.criarMovimento);

// PUT: Atualizar movimento por ID
router.put('/:id', movimentosController.atualizarMovimento);

// DELETE: Remover movimento (soft delete) por ID
router.delete('/:id', movimentosController.deletarMovimento);

module.exports = router;
