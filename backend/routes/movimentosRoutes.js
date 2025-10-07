const express = require('express');
const router = express.Router();
const movimentosController = require('../controllers/movimentosController');

// ============================================================
// ROTAS DE MOVIMENTOS - PADRÃO BRUXÃO V1
// ------------------------------------------------------------
// - Inclui rota de cancelamento com motivo opcional
// - Mantém todas as rotas originais intactas
// ============================================================

// GET: Relatório de movimentos (com filtros opcionais)
router.get('/relatorio', movimentosController.relatorioMovimentos);

// GET: Listar todos os movimentos
router.get('/', movimentosController.listarMovimentos);

// POST: Criar novo movimento
router.post('/', movimentosController.criarMovimento);

// PUT: Atualizar movimento por ID
router.put('/:id', movimentosController.atualizarMovimento);

// DELETE: Remover movimento (soft delete) por ID
router.delete('/:id', movimentosController.deletarMovimento);

// ============================================================
// NOVA ROTA - CANCELAR MOVIMENTO (soft delete + lógica contábil)
// ------------------------------------------------------------
// Endpoint: POST /api/movimentos/:id/cancelar
// Body: { motivo: 'texto opcional do cancelamento' }
// Controller: movimentosController.cancelar
// ============================================================
router.post('/:id/cancelar', movimentosController.cancelar);

module.exports = router;
