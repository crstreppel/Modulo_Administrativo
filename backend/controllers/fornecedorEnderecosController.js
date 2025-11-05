// controllers/fornecedorEnderecosController.js
const FornecedorEnderecos = require('../models/FornecedorEnderecos');

const listar = async (req, res) => {
  try {
    const enderecos = await FornecedorEnderecos.findAll();
    res.status(200).json(enderecos);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao listar endereços', erro: error.message });
  }
};

const criar = async (req, res) => {
  try {
    const { fornecedorId } = req.body;
    if (!fornecedorId) return res.status(400).json({ mensagem: 'fornecedorId é obrigatório' });
    const novoEndereco = await FornecedorEnderecos.create(req.body);
    res.status(201).json(novoEndereco);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao criar endereço', erro: error.message });
  }
};

const atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const endereco = await FornecedorEnderecos.findByPk(id);
    if (!endereco) return res.status(404).json({ mensagem: 'Endereço não encontrado' });
    await endereco.update(req.body);
    res.status(200).json({ mensagem: 'Endereço atualizado com sucesso', endereco });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao atualizar endereço', erro: error.message });
  }
};

const excluir = async (req, res) => {
  try {
    const { id } = req.params;
    const endereco = await FornecedorEnderecos.findByPk(id);
    if (!endereco) return res.status(404).json({ mensagem: 'Endereço não encontrado' });
    await endereco.destroy();
    res.status(200).json({ mensagem: 'Endereço excluído com sucesso (soft delete)' });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao excluir endereço', erro: error.message });
  }
};

module.exports = { listar, criar, atualizar, excluir };
