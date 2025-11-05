// controllers/fornecedorContatosController.js
const FornecedorContatos = require('../models/FornecedorContatos');

const listar = async (req, res) => {
  try {
    const contatos = await FornecedorContatos.findAll();
    res.status(200).json(contatos);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao listar contatos', erro: error.message });
  }
};

const criar = async (req, res) => {
  try {
    const { fornecedorId } = req.body;
    if (!fornecedorId) return res.status(400).json({ mensagem: 'fornecedorId é obrigatório' });
    const novoContato = await FornecedorContatos.create(req.body);
    res.status(201).json(novoContato);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao criar contato', erro: error.message });
  }
};

const atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const contato = await FornecedorContatos.findByPk(id);
    if (!contato) return res.status(404).json({ mensagem: 'Contato não encontrado' });
    await contato.update(req.body);
    res.status(200).json({ mensagem: 'Contato atualizado com sucesso', contato });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao atualizar contato', erro: error.message });
  }
};

const excluir = async (req, res) => {
  try {
    const { id } = req.params;
    const contato = await FornecedorContatos.findByPk(id);
    if (!contato) return res.status(404).json({ mensagem: 'Contato não encontrado' });
    await contato.destroy();
    res.status(200).json({ mensagem: 'Contato excluído com sucesso (soft delete)' });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao excluir contato', erro: error.message });
  }
};

module.exports = { listar, criar, atualizar, excluir };
