// backend/routes/servicosRoutes.js

const express = require('express');
const router = express.Router();
const servicosController = require('../controllers/servicosController');

// Corrigido: sem "/servicos" nos caminhos
router.post('/', servicosController.criarServico);
router.get('/', servicosController.listarServicos);
router.put('/:id', servicosController.atualizarServico);
router.delete('/:id', servicosController.excluirServico);

module.exports = router;
