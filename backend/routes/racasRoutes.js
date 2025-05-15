// backend/routes/racasRoutes.js

const express = require('express');
const router = express.Router();
const racasController = require('../controllers/racasController');

// Rotas para o módulo raças
router.post('/', racasController.criarRaca);
router.get('/', racasController.listarRacas);
router.put('/:id', racasController.atualizarRaca);
router.delete('/:id', racasController.excluirRaca);

module.exports = router;
