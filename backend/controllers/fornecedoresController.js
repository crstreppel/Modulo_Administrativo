// controllers/fornecedoresController.js
const Fornecedores = require('../models/Fornecedor');

const listar = async (req, res) => {
  try {
    const fornecedores = await Fornecedores.findAll();
    res.status(200).json(fornecedores);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao listar fornecedores', erro: error.message });
  }
};

const buscarPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const fornecedor = await Fornecedores.findByPk(id);
    if (!fornecedor) return res.status(404).json({ mensagem: 'Fornecedor não encontrado' });
    res.status(200).json(fornecedor);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar fornecedor', erro: error.message });
  }
};

const criar = async (req, res) => {
  try {
    const { tipoPessoa, razaoSocial, cpfCnpj, tipoFornecedor } = req.body;
    if (!tipoPessoa || !razaoSocial || !cpfCnpj || !tipoFornecedor) {
      return res.status(400).json({ mensagem: 'Campos obrigatórios: tipoPessoa, razaoSocial, cpfCnpj, tipoFornecedor' });
    }
    const novoFornecedor = await Fornecedores.create(req.body);
    res.status(201).json(novoFornecedor);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao criar fornecedor', erro: error.message });
  }
};

const atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const fornecedor = await Fornecedores.findByPk(id);
    if (!fornecedor) return res.status(404).json({ mensagem: 'Fornecedor não encontrado' });
    await fornecedor.update(req.body);
    res.status(200).json({ mensagem: 'Fornecedor atualizado com sucesso', fornecedor });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao atualizar fornecedor', erro: error.message });
  }
};

const excluir = async (req, res) => {
  try {
    const { id } = req.params;
    const fornecedor = await Fornecedores.findByPk(id);
    if (!fornecedor) return res.status(404).json({ mensagem: 'Fornecedor não encontrado' });
    await fornecedor.destroy();
    res.status(200).json({ mensagem: 'Fornecedor excluído com sucesso (soft delete)' });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao excluir fornecedor', erro: error.message });
  }
};

module.exports = { listar, buscarPorId, criar, atualizar, excluir };
