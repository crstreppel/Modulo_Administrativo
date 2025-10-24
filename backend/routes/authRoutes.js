// backend/routes/authRoutes.js
// 🔒 Padrão Bruxão V1 – Rotas de Autenticação
// - JWT + Refresh Tokens
// - Proteção extra de login (rate-limit)
// - Criação e perfil de usuários autenticados

const express = require('express');
const rateLimit = require('express-rate-limit');

const { login, refresh, logout, createUser, me, changePassword } = require('../controllers/authController');
const { verifyAccessToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/* ------------------------------------------------------------------
 * AUTENTICAÇÃO
 * ----------------------------------------------------------------*/

// Rate limit no login (anti brute-force)
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 20, // 20 tentativas por IP
  standardHeaders: true,
  legacyHeaders: false,
});

// Login
router.post('/login', loginLimiter, login);

// Refresh Token
router.post('/refresh', refresh);

// Logout (token obrigatório)
router.post('/logout', logout);

/* ------------------------------------------------------------------
 * ADMIN
 * ----------------------------------------------------------------*/

// Criação de novo usuário (somente admin)
router.post('/usuarios', verifyAccessToken, requireRole('admin'), createUser);

/* ------------------------------------------------------------------
 * PERFIL DO USUÁRIO
 * ----------------------------------------------------------------*/

// Consulta perfil logado
router.get('/me', verifyAccessToken, me);

// Troca de senha
router.post('/change-password', verifyAccessToken, changePassword);

module.exports = router;
