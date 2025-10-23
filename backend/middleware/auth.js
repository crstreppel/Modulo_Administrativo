const jwt = require('jsonwebtoken');

// Config local (sem dotenv)
const authCfg = {
  jwtAccessSecret: 'bruxao_secret_dev_2025',
};

function verifyAccessToken(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ erro: 'Token ausente' });

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, authCfg.jwtAccessSecret);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

function requireRole(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.role))
      return res.status(403).json({ erro: 'Acesso negado' });
    next();
  };
}

module.exports = { verifyAccessToken, requireRole };
