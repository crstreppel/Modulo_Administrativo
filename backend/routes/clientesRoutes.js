const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');

router.post('/', clientesController.criar);
router.get('/', clientesController.listar);
router.put('/:id', clientesController.atualizar);
router.delete('/:id', clientesController.excluir);

module.exports = router;
