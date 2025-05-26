const express = require('express');
const router = express.Router();
const condicaoDePagamentoController = require('../controllers/condicaoDePagamentoController');

// GET: Listar todas as condições de pagamento
router.get('/', condicaoDePagamentoController.listarCondicoesDePagamento);

// POST: Criar nova condição de pagamento
router.post('/', condicaoDePagamentoController.criarCondicaoDePagamento);

// PUT: Atualizar condição de pagamento por ID
router.put('/:id', condicaoDePagamentoController.atualizarCondicaoDePagamento);

// DELETE: Remover condição de pagamento (soft delete) por ID
router.delete('/:id', condicaoDePagamentoController.deletarCondicaoDePagamento);

module.exports = router;
