// controllers/fornecedorCategoriaFornecedorController.js
const FornecedorCategoriaFornecedor = require('../models/FornecedorCategoriaFornecedor');

const listar = async (req, res) => {
  try {
    const relacoes = await FornecedorCategoriaFornecedor.findAll();
    res.status(200).json(relacoes);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao listar relações fornecedor/categoria', erro: error.message });
  }
};

const criar = async (req, res) => {
  try {
    const { fornecedorId, categoriaId } = req.body;
    if (!fornecedorId || !categoriaId) {
      return res.status(400).json({ mensagem: 'Campos obrigatórios: fornecedorId e categoriaId' });
    }
    const novaRelacao = await FornecedorCategoriaFornecedor.create(req.body);
    res.status(201).json(novaRelacao);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao criar relação fornecedor/categoria', erro: error.message });
  }
};

const excluir = async (req, res) => {
  try {
    const { fornecedorId, categoriaId } = req.body;
    const relacao = await FornecedorCategoriaFornecedor.findOne({ where: { fornecedorId, categoriaId } });
    if (!relacao) return res.status(404).json({ mensagem: 'Relação não encontrada' });
    await relacao.destroy();
    res.status(200).json({ mensagem: 'Relação excluída com sucesso (soft delete)' });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao excluir relação fornecedor/categoria', erro: error.message });
  }
};

module.exports = { listar, criar, excluir };
