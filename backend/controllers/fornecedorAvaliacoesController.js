// controllers/fornecedorAvaliacoesController.js
const FornecedorAvaliacoes = require('../models/FornecedorAvaliacoes');
const Fornecedores = require('../models/Fornecedor');

const listar = async (req, res) => {
  try {
    const avaliacoes = await FornecedorAvaliacoes.findAll();
    res.status(200).json(avaliacoes);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao listar avaliações', erro: error.message });
  }
};

const criar = async (req, res) => {
  try {
    const { fornecedorId, criterio, nota } = req.body;
    if (!fornecedorId || !criterio || !nota) {
      return res.status(400).json({ mensagem: 'Campos obrigatórios: fornecedorId, criterio, nota' });
    }

    const novaAvaliacao = await FornecedorAvaliacoes.create(req.body);

    // Atualiza o scoreAtual no model Fornecedores (média das notas)
    const avaliacoes = await FornecedorAvaliacoes.findAll({ where: { fornecedorId } });
    const media = avaliacoes.reduce((acc, a) => acc + parseFloat(a.nota), 0) / avaliacoes.length;

    const fornecedor = await Fornecedores.findByPk(fornecedorId);
    if (fornecedor) await fornecedor.update({ scoreAtual: media.toFixed(2) });

    res.status(201).json({ mensagem: 'Avaliação criada e score atualizado', novaAvaliacao });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao criar avaliação', erro: error.message });
  }
};

const excluir = async (req, res) => {
  try {
    const { id } = req.params;
    const avaliacao = await FornecedorAvaliacoes.findByPk(id);
    if (!avaliacao) return res.status(404).json({ mensagem: 'Avaliação não encontrada' });
    await avaliacao.destroy();
    res.status(200).json({ mensagem: 'Avaliação excluída com sucesso (soft delete)' });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao excluir avaliação', erro: error.message });
  }
};

module.exports = { listar, criar, excluir };
