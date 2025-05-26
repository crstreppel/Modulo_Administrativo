const CondicaoDePagamento = require('../models/CondicaoDePagamento');
const Status = require('../models/Status');

// GET: Listar todas as condições de pagamento
const listarCondicoesDePagamento = async (req, res) => {
  try {
    const condicoes = await CondicaoDePagamento.findAll({
      include: [{ model: Status, as: 'status' }]
    });
    res.status(200).json(condicoes);
  } catch (error) {
    console.error('Erro ao listar condições de pagamento:', error);
    res.status(500).json({ erro: 'Erro ao buscar condições de pagamento.' });
  }
};

// POST: Criar uma nova condição de pagamento
const criarCondicaoDePagamento = async (req, res) => {
  const { descricao, statusId } = req.body;

  try {
    const novaCondicao = await CondicaoDePagamento.create({
      descricao,
      statusId
    });
    res.status(201).json(novaCondicao);
  } catch (error) {
    console.error('Erro ao criar condição de pagamento:', error);
    res.status(500).json({ erro: 'Erro ao criar condição de pagamento.' });
  }
};

// PUT: Atualizar uma condição de pagamento
const atualizarCondicaoDePagamento = async (req, res) => {
  const { id } = req.params;
  const { descricao, statusId } = req.body;

  try {
    const condicao = await CondicaoDePagamento.findByPk(id);

    if (!condicao) {
      return res.status(404).json({ erro: 'Condição de pagamento não encontrada.' });
    }

    await condicao.update({ descricao, statusId });
    res.status(200).json(condicao);
  } catch (error) {
    console.error('Erro ao atualizar condição de pagamento:', error);
    res.status(500).json({ erro: 'Erro ao atualizar condição de pagamento.' });
  }
};

// DELETE: Excluir (soft delete) uma condição de pagamento
const deletarCondicaoDePagamento = async (req, res) => {
  const { id } = req.params;

  try {
    const condicao = await CondicaoDePagamento.findByPk(id);

    if (!condicao) {
      return res.status(404).json({ erro: 'Condição de pagamento não encontrada.' });
    }

    await condicao.destroy(); // Soft delete
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar condição de pagamento:', error);
    res.status(500).json({ erro: 'Erro ao deletar condição de pagamento.' });
  }
};

module.exports = {
  listarCondicoesDePagamento,
  criarCondicaoDePagamento,
  atualizarCondicaoDePagamento,
  deletarCondicaoDePagamento,
};
