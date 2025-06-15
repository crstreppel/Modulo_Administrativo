const Pets = require('../models/Pets');
const Clientes = require('../models/Clientes');
const Especie = require('../models/Especie');
const Racas = require('../models/Racas');
const Status = require('../models/Status');

// GET: Listar todos os pets ou filtrar por clienteId
const listarPets = async (req, res) => {
  const { clienteId } = req.query;

  const where = {};
  if (clienteId) {
    where.clienteId = clienteId;
  }

  try {
    const pets = await Pets.findAll({
      where,
      include: [
        { model: Clientes, as: 'cliente' },
        { model: Especie, as: 'especie' },
        { model: Racas, as: 'raca' },
        { model: Status, as: 'status' }
      ]
    });
    res.status(200).json(pets);
  } catch (error) {
    console.error('Erro ao listar pets:', error);
    res.status(500).json({ erro: 'Erro ao buscar pets.' });
  }
};

// POST: Criar um novo pet
const criarPet = async (req, res) => {
  const { nome, clienteId, especieId, racaId, foto, statusId } = req.body;

  try {
    const novoPet = await Pets.create({
      nome,
      clienteId,
      especieId,
      racaId,
      foto,
      statusId
    });
    res.status(201).json(novoPet);
  } catch (error) {
    console.error('Erro ao criar pet:', error);
    res.status(500).json({ erro: 'Erro ao criar pet.' });
  }
};

// PUT: Atualizar um pet existente
const atualizarPet = async (req, res) => {
  const { id } = req.params;
  const { nome, clienteId, especieId, racaId, foto, statusId } = req.body;

  try {
    const pet = await Pets.findByPk(id);

    if (!pet) {
      return res.status(404).json({ erro: 'Pet não encontrado.' });
    }

    await pet.update({ nome, clienteId, especieId, racaId, foto, statusId });
    res.status(200).json(pet);
  } catch (error) {
    console.error('Erro ao atualizar pet:', error);
    res.status(500).json({ erro: 'Erro ao atualizar pet.' });
  }
};

// DELETE: Excluir (soft delete) um pet
const deletarPet = async (req, res) => {
  const { id } = req.params;

  try {
    const pet = await Pets.findByPk(id);

    if (!pet) {
      return res.status(404).json({ erro: 'Pet não encontrado.' });
    }

    await pet.destroy(); // Soft delete ativado
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar pet:', error);
    res.status(500).json({ erro: 'Erro ao deletar pet.' });
  }
};

module.exports = {
  listarPets,
  criarPet,
  atualizarPet,
  deletarPet,
};
