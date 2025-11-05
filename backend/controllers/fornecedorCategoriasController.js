// controllers/fornecedorCategoriasController.js
const FornecedorCategorias = require('../models/FornecedorCategorias');

const listar = async (req, res) => {
  try {
    const categorias = await FornecedorCategorias.findAll();
    res.status(200).json(categorias);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao listar categorias', erro: error.message });
  }
};

const buscarPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const categoria = await FornecedorCategorias.findByPk(id);
    if (!categoria) return res.status(404).json({ mensagem: 'Categoria não encontrada' });
    res.status(200).json(categoria);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar categoria', erro: error.message });
  }
};

const criar = async (req, res) => {
  try {
    const { descricao } = req.body;
    if (!descricao) return res.status(400).json({ mensagem: 'Campo obrigatório: descricao' });
    const novaCategoria = await FornecedorCategorias.create(req.body);
    res.status(201).json(novaCategoria);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao criar categoria', erro: error.message });
  }
};

const atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const categoria = await FornecedorCategorias.findByPk(id);
    if (!categoria) return res.status(404).json({ mensagem: 'Categoria não encontrada' });
    await categoria.update(req.body);
    res.status(200).json({ mensagem: 'Categoria atualizada com sucesso', categoria });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao atualizar categoria', erro: error.message });
  }
};

const excluir = async (req, res) => {
  try {
    const { id } = req.params;
    const categoria = await FornecedorCategorias.findByPk(id);
    if (!categoria) return res.status(404).json({ mensagem: 'Categoria não encontrada' });
    await categoria.destroy();
    res.status(200).json({ mensagem: 'Categoria excluída com sucesso (soft delete)' });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao excluir categoria', erro: error.message });
  }
};

module.exports = { listar, buscarPorId, criar, atualizar, excluir };
