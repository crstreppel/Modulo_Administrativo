const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db');
const { DataTypes } = require('sequelize');

const Usuario = require('../models/Usuario')(sequelize, DataTypes);
const Role = require('../models/Role')(sequelize, DataTypes);

async function listar(req, res) {
  try {
    const itens = await Usuario.findAll({
      include: [{ model: Role, as: 'role', attributes: ['id', 'nome'] }],
      order: [['id', 'ASC']],
    });
    return res.status(200).json(itens);
  } catch (err) {
    console.error('⚠️ Erro ao listar usuários:', err);
    return res.status(500).json({ erro: 'Erro ao listar usuários.' });
  }
}

async function atualizar(req, res) {
  const { id } = req.params;
  const { nome, email, roleNome, status } = req.body;

  try {
    const u = await Usuario.findByPk(id);
    if (!u) return res.status(404).json({ erro: 'Usuário não encontrado.' });

    if (nome) u.nome = nome;
    if (email) u.email = email;

    if (status) {
      const statusValido = ['ativo', 'bloqueado'];
      if (!statusValido.includes(status))
        return res.status(400).json({ erro: 'Status inválido.' });
      u.status = status;
    }

    if (roleNome) {
      const role = await Role.findOne({ where: { nome: roleNome } });
      if (!role) return res.status(400).json({ erro: 'Role inválida.' });
      u.roleId = role.id;
    }

    await u.save();
    return res.status(200).json({ ok: true, usuarioId: u.id });
  } catch (err) {
    console.error('⚠️ Erro ao atualizar usuário:', err);
    return res.status(500).json({ erro: 'Erro ao atualizar usuário.' });
  }
}

async function resetSenha(req, res) {
  const { id } = req.params;
  const { novaSenha } = req.body;

  try {
    const u = await Usuario.findByPk(id);
    if (!u) return res.status(404).json({ erro: 'Usuário não encontrado.' });

    if (!novaSenha || novaSenha.length < 6)
      return res.status(400).json({ erro: 'A nova senha deve ter ao menos 6 caracteres.' });

    u.senhaHash = await bcrypt.hash(novaSenha, 12);
    u.precisaTrocarSenha = true;
    await u.save();

    return res.status(200).json({ ok: true, mensagem: 'Senha redefinida com sucesso.' });
  } catch (err) {
    console.error('⚠️ Erro ao resetar senha:', err);
    return res.status(500).json({ erro: 'Erro ao resetar senha.' });
  }
}

module.exports = { listar, atualizar, resetSenha };
