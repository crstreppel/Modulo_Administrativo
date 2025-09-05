// backend/controllers/racasController.js
// v1.4 — Corrige require do model (Especie, singular) e aplica filtros em listarRacas.

const { Op } = require('sequelize');
const Racas   = require('../models/Racas');
const Especie = require('../models/Especie'); // <-- SINGULAR, bate com teu projeto
const Status  = require('../models/Status');

// GET: Listar raças (com filtros opcionais via query string)
const listarRacas = async (req, res) => {
  try {
    const {
      especieId: especieIdQ,
      especie_id: especieIdSnake, // aceita snake por segurança
      statusId: statusIdQ,
      status_id: statusIdSnake,
      q,
    } = req.query;

    const where = {};

    // especieId
    const especieIdRaw = especieIdQ ?? especieIdSnake ?? null;
    if (especieIdRaw !== null && especieIdRaw !== '') {
      const parsed = Number.parseInt(especieIdRaw, 10);
      if (Number.isFinite(parsed)) {
        // se no model Racas o campo tem field: 'especie_id', aqui continua 'especieId'
        where.especieId = parsed;
      }
    }

    // statusId
    const statusIdRaw = statusIdQ ?? statusIdSnake ?? null;
    if (statusIdRaw !== null && statusIdRaw !== '') {
      const parsed = Number.parseInt(statusIdRaw, 10);
      if (Number.isFinite(parsed)) {
        where.statusId = parsed;
      }
    }

    // busca por descrição (case-insensitive)
    if (q && String(q).trim() !== '') {
      where.descricao = { [Op.iLike]: `%${String(q).trim()}%` };
    }

    const racas = await Racas.findAll({
      where,
      include: [
        { model: Especie, as: 'especie', attributes: ['id', 'descricao'] },
        { model: Status,  as: 'status',  attributes: ['id', 'descricao'] },
      ],
      order: [['descricao', 'ASC']],
    });

    return res.status(200).json(racas);
  } catch (error) {
    console.error('Erro ao listar raças:', error);
    return res.status(500).json({ erro: 'Erro ao buscar raças.' });
  }
};

// POST: Criar uma nova raça
const criarRaca = async (req, res) => {
  const { descricao, statusId, especieId } = req.body;

  try {
    const novaRaca = await Racas.create({ descricao, statusId, especieId });
    return res.status(201).json(novaRaca);
  } catch (error) {
    console.error('Erro ao criar raça:', error);
    return res.status(500).json({ erro: 'Erro ao criar raça.' });
  }
};

// PUT: Atualizar uma raça existente
const atualizarRaca = async (req, res) => {
  const { id } = req.params;
  const { descricao, statusId, especieId } = req.body;

  try {
    const raca = await Racas.findByPk(id);
    if (!raca) {
      return res.status(404).json({ erro: 'Raça não encontrada.' });
    }

    await raca.update({ descricao, statusId, especieId });
    return res.status(200).json(raca);
  } catch (error) {
    console.error('Erro ao atualizar raça:', error);
    return res.status(500).json({ erro: 'Erro ao atualizar raça.' });
  }
};

// DELETE: Excluir (soft delete) uma raça
const deletarRaca = async (req, res) => {
  const { id } = req.params;

  try {
    const raca = await Racas.findByPk(id);
    if (!raca) {
      return res.status(404).json({ erro: 'Raça não encontrada.' });
    }

    await raca.destroy(); // Soft delete (paranoid: true)
    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar raça:', error);
    return res.status(500).json({ erro: 'Erro ao deletar raça.' });
  }
};

module.exports = {
  listarRacas,
  criarRaca,
  atualizarRaca,
  deletarRaca,
};
