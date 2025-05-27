const express = require('express');
const router = express.Router();
const meioDePagamentoController = require('../controllers/meioDePagamentoController');

router.post('/', meioDePagamentoController.criarMeioDePagamento);
router.get('/', meioDePagamentoController.listarMeiosDePagamento);
router.put('/:id', meioDePagamentoController.atualizarMeioDePagamento);
router.delete('/:id', meioDePagamentoController.deletarMeioDePagamento);

module.exports = router;
