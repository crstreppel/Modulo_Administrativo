const express = require('express');
const router = express.Router();
const especieController = require('../controllers/especieController');

// Rotas para o módulo espécies
router.post('/', especieController.criarEspecie);
router.get('/', especieController.listarEspecies);
router.put('/:id', especieController.atualizarEspecie);
router.delete('/:id', especieController.excluirEspecie);

module.exports = router;
