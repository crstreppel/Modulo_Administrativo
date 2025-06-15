const Movimentos = require('../models/Movimentos');
const Clientes = require('../models/Clientes');
const Pets = require('../models/Pets');
const Servicos = require('../models/Servicos');
const CondicaoDePagamento = require('../models/CondicaoDePagamento');
const MeioDePagamento = require('../models/MeioDePagamento');
const Status = require('../models/Status');

// GET: Listar todos os movimentos
const listarMovimentos = async (req, res) => {
  try {
    const movimentos = await Movimentos.findAll({
      include: [
        { model: Clientes, as: 'cliente' },
        { model: Pets, as: 'pet' },
        { model: Servicos, as: 'servico' },
        { model: CondicaoDePagamento, as: 'condicaoDePagamento' },
        { model: MeioDePagamento, as: 'meioDePagamento' },
        { model: Status, as: 'status' }
      ]
    });
    res.status(200).json(movimentos);
  } catch (error) {
    console.error('Erro ao listar movimentos:', error);
    res.status(500).json({ erro: 'Erro ao buscar movimentos.' });
  }
};

// POST: Criar um novo movimento
const criarMovimento = async (req, res) => {
  const {
    data_lancamento,
    data_movimento,
    clienteId,
    petId,
    servicoId,
    valor,
    condicaoDePagamentoId,
    meioDePagamentoId,
    data_vencimento,
    data_liquidacao,
    observacao,
    statusId
  } = req.body;

  try {
    const novoMovimento = await Movimentos.create({
      data_lancamento,
      data_movimento,
      clienteId,
      petId,
      servicoId,
      valor,
      condicaoDePagamentoId,
      meioDePagamentoId,
      data_vencimento,
      data_liquidacao,
      observacao,
      statusId
    });
    res.status(201).json(novoMovimento);
  } catch (error) {
    console.error('Erro ao criar movimento:', error);
    res.status(500).json({ erro: 'Erro ao criar movimento.' });
  }
};

// PUT: Atualizar um movimento existente
const atualizarMovimento = async (req, res) => {
  const { id } = req.params;
  const {
    data_lancamento,
    data_movimento,
    clienteId,
    petId,
    servicoId,
    valor,
    condicaoDePagamentoId,
    meioDePagamentoId,
    data_vencimento,
    data_liquidacao,
    observacao,
    statusId
  } = req.body;

  try {
    const movimento = await Movimentos.findByPk(id);

    if (!movimento) {
      return res.status(404).json({ erro: 'Movimento não encontrado.' });
    }

    await movimento.update({
      data_lancamento,
      data_movimento,
      clienteId,
      petId,
      servicoId,
      valor,
      condicaoDePagamentoId,
      meioDePagamentoId,
      data_vencimento,
      data_liquidacao,
      observacao,
      statusId
    });

    res.status(200).json(movimento);
  } catch (error) {
    console.error('Erro ao atualizar movimento:', error);
    res.status(500).json({ erro: 'Erro ao atualizar movimento.' });
  }
};

// DELETE: Soft delete de um movimento
const deletarMovimento = async (req, res) => {
  const { id } = req.params;

  try {
    const movimento = await Movimentos.findByPk(id);

    if (!movimento) {
      return res.status(404).json({ erro: 'Movimento não encontrado.' });
    }

    await movimento.destroy(); // Soft delete ativado
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar movimento:', error);
    res.status(500).json({ erro: 'Erro ao deletar movimento.' });
  }
};

module.exports = {
  listarMovimentos,
  criarMovimento,
  atualizarMovimento,
  deletarMovimento,
};
