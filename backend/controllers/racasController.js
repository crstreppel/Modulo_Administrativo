// backend/controllers/racasController.js

const Racas = require('../models/Racas');
const Especie = require('../models/Especie');
const Status = require('../models/Status');

// GET: Listar todas as raças
const listarRacas = async (req, res) => {
  try {
    const racas = await Racas.findAll({
      include: [
        { model: Especie, as: 'especie' },
        { model: Status, as: 'status' }
      ]
    });
    res.status(200).json(racas);
  } catch (error) {
    console.error('Erro ao listar raças:', error);
    res.status(500).json({ erro: 'Erro ao buscar raças.' });
  }
};

// POST: Criar uma nova raça
const criarRaca = async (req, res) => {
  const { descricao, statusId, especieId } = req.body;

  try {
    const novaRaca = await Racas.create({
      descricao,
      statusId,
      especieId,
    });
    res.status(201).json(novaRaca);
  } catch (error) {
    console.error('Erro ao criar raça:', error);
    res.status(500).json({ erro: 'Erro ao criar raça.' });
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
    res.status(200).json(raca);
  } catch (error) {
    console.error('Erro ao atualizar raça:', error);
    res.status(500).json({ erro: 'Erro ao atualizar raça.' });
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

    await raca.destroy(); // Soft delete por causa do `paranoid: true`
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar raça:', error);
    res.status(500).json({ erro: 'Erro ao deletar raça.' });
  }
};

module.exports = {
  listarRacas,
  criarRaca,
  atualizarRaca,
  deletarRaca,
};
