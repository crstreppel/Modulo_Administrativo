// routes/contasAReceberRoutes.js (v1.1) - padrão bruxão
const express = require('express');
const router = express.Router();

const contasAReceberController = require('../controllers/contasAReceberController');

// Listar (suporta ?movimentoId=123)
router.get('/', contasAReceberController.listarContasAReceber);

// Criar
router.post('/', contasAReceberController.criarContaReceber);

// Atualizar pelo id (uso geral)
router.put('/:id', contasAReceberController.atualizarContaReceber);

// Excluir (soft delete) pelo id
router.delete('/:id', contasAReceberController.excluirContaReceber);

// Ações
router.post('/:id/liquidar', contasAReceberController.liquidarContaReceber);
router.post('/:id/cancelar', contasAReceberController.cancelarContaReceber);
router.post('/:id/prorrogar', contasAReceberController.prorrogarContaReceber);

module.exports = router;
