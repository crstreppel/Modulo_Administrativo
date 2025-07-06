const Adiantamentos = require('../models/Adiantamento');
const Clientes = require('../models/Clientes');
const Pets = require('../models/Pets');

const listarAdiantamentos = async (req, res) => {
  try {
    const adiantamentos = await Adiantamentos.findAll({
      include: [
        { model: Clientes, as: 'cliente', attributes: ['id', 'nome'] },
        { model: Pets, as: 'pet', attributes: ['id', 'nome'] }
      ],
      order: [['updatedAt', 'DESC']]
    });

    res.status(200).json(adiantamentos);
  } catch (error) {
    console.error('Erro ao listar adiantamentos:', error);
    res.status(500).json({ erro: 'Erro ao buscar adiantamentos.' });
  }
};

module.exports = {
  listarAdiantamentos
};
