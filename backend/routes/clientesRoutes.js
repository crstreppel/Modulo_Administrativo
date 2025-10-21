const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clientesController');

router.post('/', clienteController.criar);
router.get('/', clienteController.listar);
router.get('/:id', clienteController.buscarPorId); // 🔹 Novo endpoint
router.put('/:id', clienteController.atualizar);
router.delete('/:id', clienteController.excluir);

module.exports = router;
