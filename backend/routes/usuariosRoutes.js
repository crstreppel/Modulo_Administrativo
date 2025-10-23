// backend/routes/usuariosRoutes.js
// 👑 Padrão Bruxão V1 – Rotas de Usuários
// - Protegidas com JWT e role admin
// - Operações administrativas sobre usuários

const express = require('express');
const { listar, atualizar, resetSenha } = require('../controllers/usuariosController');
const { verifyAccessToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/* ------------------------------------------------------------------
 * ADMIN - Gestão de Usuários
 * ----------------------------------------------------------------*/

// Listar todos os usuários
router.get('/', verifyAccessToken, requireRole('admin'), listar);

// Atualizar dados de um usuário
router.put('/:id', verifyAccessToken, requireRole('admin'), atualizar);

// Resetar senha (forçado pelo admin)
router.post('/reset-senha/:id', verifyAccessToken, requireRole('admin'), resetSenha);

module.exports = router;
