const express = require('express');
const router = express.Router();

const contasAReceberController = require('../controllers/contasAReceberController');

// Listar todas as contas a receber
router.get('/', contasAReceberController.listarContasAReceber);

// Criar nova conta a receber
router.post('/', contasAReceberController.criarContaReceber);

// Atualizar conta a receber pelo id
router.put('/:id', contasAReceberController.atualizarContaReceber);

// Excluir (soft delete) conta a receber pelo id
router.delete('/:id', contasAReceberController.excluirContaReceber);

module.exports = router;
