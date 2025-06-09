const Meio_de_pagamento = require('../models/MeioDePagamento');
const Status = require('../models/Status');

// GET: Listar todos os meios de pagamento
const listarMeiosDePagamento = async (req, res) => {
  try {
    const meios = await Meio_de_pagamento.findAll({
      include: [{ model: Status, as: 'status' }]
    });
    res.status(200).json(meios);
  } catch (error) {
    console.error('Erro ao listar meios de pagamento:', error);
    res.status(500).json({ erro: 'Erro ao buscar meios de pagamento.' });
  }
};

// POST: Criar um novo meio de pagamento
const criarMeioDePagamento = async (req, res) => {
  const { descricao, statusId } = req.body;

  try {
    const novoMeio = await Meio_de_pagamento.create({
      descricao,
      statusId,
    });
    res.status(201).json(novoMeio);
  } catch (error) {
    console.error('Erro ao criar meio de pagamento:', error);
    res.status(500).json({ erro: 'Erro ao criar meio de pagamento.' });
  }
};

// PUT: Atualizar um meio de pagamento existente
const atualizarMeioDePagamento = async (req, res) => {
  const { id } = req.params;
  const { descricao, statusId } = req.body;

  try {
    const meio = await Meio_de_pagamento.findByPk(id);

    if (!meio) {
      return res.status(404).json({ erro: 'Meio de pagamento não encontrado.' });
    }

    await meio.update({ descricao, statusId });
    res.status(200).json(meio);
  } catch (error) {
    console.error('Erro ao atualizar meio de pagamento:', error);
    res.status(500).json({ erro: 'Erro ao atualizar meio de pagamento.' });
  }
};

// DELETE: Excluir (soft delete) um meio de pagamento
const deletarMeioDePagamento = async (req, res) => {
  const { id } = req.params;

  try {
    const meio = await Meio_de_pagamento.findByPk(id);

    if (!meio) {
      return res.status(404).json({ erro: 'Meio de pagamento não encontrado.' });
    }

    await meio.destroy(); // Soft delete
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar meio de pagamento:', error);
    res.status(500).json({ erro: 'Erro ao deletar meio de pagamento.' });
  }
};

module.exports = {
  listarMeiosDePagamento,
  criarMeioDePagamento,
  atualizarMeioDePagamento,
  deletarMeioDePagamento,
};
