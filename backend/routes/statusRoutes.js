// backend/routes/statusRoutes.js

const express = require('express');
const router = express.Router();
const statusController = require('../controllers/statusController');

// Rotas CRUD para Status
router.post('/', statusController.criar);
router.get('/', statusController.listar);
router.get('/:id', statusController.buscarPorId);
router.put('/:id', statusController.atualizar);
router.delete('/:id', statusController.deletar);

module.exports = router;
