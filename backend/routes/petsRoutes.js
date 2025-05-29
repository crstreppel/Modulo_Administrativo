const express = require('express');
const router = express.Router();
const petsController = require('../controllers/petsController');

// GET: Listar todos os pets
router.get('/', petsController.listarPets);

// POST: Criar novo pet
router.post('/', petsController.criarPet);

// PUT: Atualizar pet por ID
router.put('/:id', petsController.atualizarPet);

// DELETE: Remover pet (soft delete) por ID
router.delete('/:id', petsController.deletarPet);

module.exports = router;
