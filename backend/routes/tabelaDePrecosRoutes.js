// === routes: tabelaDePrecosRoutes.js ===
const express = require('express');
const router = express.Router();

// Se seu arquivo estiver como "TabelaDePrecosController.js" (T maiúsculo), troque a linha abaixo.
const tabelaDePrecosController = require('../controllers/tabelaDePrecosController');

// Listar (com filtros opcionais)
router.get('/', tabelaDePrecosController.listarTabelaDePrecos);

// Verificar existência (pet/raça + condição + serviço)
router.get('/verificar', tabelaDePrecosController.verificarEntrada);

// Buscar por PET/RAÇA/GENÉRICO (principal usado pelo cad_movimentos.js)
router.get('/buscarPorPetOuRaca', tabelaDePrecosController.buscarPorPetOuRaca);

// Retrocompat: nome antigo do handler
router.get('/buscarTabelaPorPetOuRaca', tabelaDePrecosController.buscarPorPetOuRaca);

// Retrocompat: rota antiga com :petId
router.get('/buscarPorPet/:petId', (req, res) => {
  req.query.petId = req.params.petId;
  return tabelaDePrecosController.buscarPorPetOuRaca(req, res);
});

// CRUD
router.post('/', tabelaDePrecosController.criarTabelaDePrecos);
router.put('/:id', tabelaDePrecosController.atualizarTabelaDePrecos);
router.delete('/:id', tabelaDePrecosController.deletarTabelaDePrecos);

module.exports = router;
