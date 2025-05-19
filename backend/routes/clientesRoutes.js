const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');

// Rotas do módulo Clientes
router.post('/', clientesController.criarCliente);
router.get('/', clientesController.listarClientes);
router.put('/:id', clientesController.atualizarCliente);
router.delete('/:id', clientesController.excluirCliente);

module.exports = router;
