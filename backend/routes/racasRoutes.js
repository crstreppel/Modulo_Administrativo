// backend/routes/racasRoutes.js

const express = require('express');
const router = express.Router();
const racasController = require('../controllers/racasController');

// GET: Listar todas as raças
router.get('/', racasController.listarRacas);

// POST: Criar nova raça
router.post('/', racasController.criarRaca);

// PUT: Atualizar raça por ID
router.put('/:id', racasController.atualizarRaca);

// DELETE: Remover raça (soft delete) por ID
router.delete('/:id', racasController.deletarRaca);

module.exports = router;
