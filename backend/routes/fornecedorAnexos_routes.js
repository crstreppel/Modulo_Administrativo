// routes/fornecedorAnexos_routes.js
const express = require('express');
const router = express.Router();
const fornecedorAnexosController = require('../controllers/fornecedorAnexosController');

router.get('/', fornecedorAnexosController.listar);
router.post('/', fornecedorAnexosController.criar);
router.delete('/:id', fornecedorAnexosController.excluir);

module.exports = router;
