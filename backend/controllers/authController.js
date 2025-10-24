// backend/controllers/authController.js
// 🔒 Padrão Bruxão V1 – Autenticação JWT + Refresh Tokens (sem dotenv)
// -------------------------------------------------------------
// Revisado para logar leitura de cookies e evitar falso "Token ausente"
// -------------------------------------------------------------

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');

const { Usuario, Role, RefreshToken } = require('../models/associations');

// -------------------------------------------------------------
// ⚙️ Configuração direta (sem dotenv)
// -------------------------------------------------------------
const authCfg = {
  jwtAccessSecret: 'bruxao_secret_dev_2025',
  accessTokenTtlSec: 900, // 15 minutos
  refreshTokenTtlSec: 60 * 60 * 24 * 7, // 7 dias
  cookieName: 'refreshToken',
  sameSite: 'lax',
  cookieSecure: false,
  maxFailedLogins: 5,
  lockMinutes: 15,
};

// -------------------------------------------------------------
// 🧩 Helpers
// -------------------------------------------------------------
function signAccessToken(u) {
  const payload = {
    sub: String(u.id),
    id: u.id,
    role: u.roleId || 'operador',
    nome: u.nome,
  };
  return jwt.sign(payload, authCfg.jwtAccessSecret, {
    expiresIn: authCfg.accessTokenTtlSec,
  });
}

async function issueRefreshToken(u, req, res) {
  const raw = crypto.randomBytes(64).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
  const jti = uuidv4();

  const expiresAt = dayjs().add(authCfg.refreshTokenTtlSec, 'second').toDate();

  await RefreshToken.create({
    jti,
    tokenHash,
    usuarioId: u.id,
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip,
    expiresAt,
  });

  res.cookie(authCfg.cookieName, raw, {
    httpOnly: true,
    secure: authCfg.cookieSecure,
    sameSite: authCfg.sameSite,
    maxAge: authCfg.refreshTokenTtlSec * 1000,
    path: '/api/auth',
  });

  return { jti, expiresAt };
}

async function clearRefreshCookie(res) {
  res.clearCookie(authCfg.cookieName, { path: '/api/auth' });
}

// -------------------------------------------------------------
// 🔑 Rotas principais
// -------------------------------------------------------------
async function login(req, res) {
  const { email, senha } = req.body;
  if (!email || !senha)
    return res.status(400).json({ erro: 'Email e senha são obrigatórios' });

  const u = await Usuario.findOne({
    where: { email },
    include: [{ model: Role, as: 'role' }],
  });

  if (!u) return res.status(401).json({ erro: 'Credenciais inválidas' });

  if (u.bloqueadoAte && dayjs().isBefore(dayjs(u.bloqueadoAte)))
    return res.status(423).json({ erro: 'Usuário temporariamente bloqueado' });

  const ok = await bcrypt.compare(senha, u.senhaHash);
  if (!ok) {
    u.tentativasFalhas += 1;
    if (u.tentativasFalhas >= authCfg.maxFailedLogins) {
      u.bloqueadoAte = dayjs().add(authCfg.lockMinutes, 'minute').toDate();
      u.tentativasFalhas = 0;
    }
    await u.save();
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }

  u.tentativasFalhas = 0;
  u.bloqueadoAte = null;
  u.ultimoLoginAt = new Date();
  await u.save();

  const accessToken = signAccessToken(u);
  await issueRefreshToken(u, req, res);

  return res.json({
    accessToken,
    usuario: { id: u.id, nome: u.nome, email: u.email, role: u.roleId },
  });
}

async function refresh(req, res) {
  console.log('🧙‍♂️ [DEBUG] Cookies recebidos:', req.cookies);

  const raw = req.cookies?.[authCfg.cookieName];
  if (!raw) {
    console.warn('⚠️ [WARN] Nenhum refreshToken recebido no cookie.');
    return res.status(401).json({ erro: 'Nenhum refreshToken recebido' });
  }

  const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
  const reg = await RefreshToken.findOne({
    where: { tokenHash, revokedAt: null },
    include: [
      {
        model: Usuario,
        as: 'usuario',
        include: [{ model: Role, as: 'role' }],
      },
    ],
  });

  if (!reg) {
    console.warn('⚠️ [WARN] Refresh token não encontrado ou já revogado.');
    return res.status(401).json({ erro: 'Refresh inválido' });
  }

  if (dayjs().isAfter(dayjs(reg.expiresAt))) {
    console.warn('⚠️ [WARN] Refresh token expirado.');
    return res.status(401).json({ erro: 'Refresh expirado' });
  }

  reg.revokedAt = new Date();
  await reg.save();

  const u = reg.usuario;
  const accessToken = signAccessToken(u);
  await issueRefreshToken(u, req, res);

  console.log(`✅ [OK] Refresh token renovado para usuário ID ${u.id}`);
  return res.json({ accessToken });
}

async function logout(req, res) {
  console.log('🧙‍♂️ [DEBUG] Cookies no logout:', req.cookies);

  const raw = req.cookies?.[authCfg.cookieName];
  if (!raw) {
    console.warn('⚠️ [WARN] Nenhum cookie de refreshToken no logout.');
    await clearRefreshCookie(res);
    return res.status(400).json({ erro: 'Nenhum token de logout encontrado' });
  }

  const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
  const reg = await RefreshToken.findOne({ where: { tokenHash, revokedAt: null } });

  if (reg) {
    reg.revokedAt = new Date();
    await reg.save();
    console.log(`🧹 [LOGOUT] Token revogado para usuário ID ${reg.usuarioId}`);
  } else {
    console.warn('⚠️ [WARN] Nenhum token ativo encontrado para revogar.');
  }

  await clearRefreshCookie(res);
  return res.json({ ok: true });
}

// -------------------------------------------------------------
// 👥 Rotas auxiliares
// -------------------------------------------------------------
async function createUser(req, res) {
  const { nome, email, senha, roleNome = 'operador' } = req.body;
  if (!nome || !email || !senha)
    return res
      .status(400)
      .json({ erro: 'Campos obrigatórios: nome, email, senha' });

  const existe = await Usuario.findOne({ where: { email } });
  if (existe) return res.status(409).json({ erro: 'Email já cadastrado' });

  const role = await Role.findOne({ where: { nome: roleNome } });
  if (!role) return res.status(400).json({ erro: 'Role inválida' });

  const senhaHash = await bcrypt.hash(senha, 12);
  const novo = await Usuario.create({
    nome,
    email,
    senhaHash,
    roleId: role.id,
  });

  return res.status(201).json({
    id: novo.id,
    nome: novo.nome,
    email: novo.email,
    role: role.nome,
  });
}

async function me(req, res) {
  const u = await Usuario.findByPk(req.user.id, {
    include: [{ model: Role, as: 'role' }],
  });
  if (!u) return res.status(404).json({ erro: 'Usuário não encontrado' });

  return res.json({
    id: u.id,
    nome: u.nome,
    email: u.email,
    role: u.role?.nome || null,
    ultimoLoginAt: u.ultimoLoginAt,
  });
}

async function changePassword(req, res) {
  const { senhaAtual, novaSenha } = req.body;
  if (!senhaAtual || !novaSenha)
    return res.status(400).json({ erro: 'Informe senhaAtual e novaSenha' });

  const u = await Usuario.findByPk(req.user.id);
  if (!u) return res.status(404).json({ erro: 'Usuário não encontrado' });

  const ok = await bcrypt.compare(senhaAtual, u.senhaHash);
  if (!ok) return res.status(401).json({ erro: 'Senha atual incorreta' });

  u.senhaHash = await bcrypt.hash(novaSenha, 12);
  u.precisaTrocarSenha = false;
  await u.save();

  return res.json({ ok: true });
}

module.exports = {
  login,
  refresh,
  logout,
  createUser,
  me,
  changePassword,
};
