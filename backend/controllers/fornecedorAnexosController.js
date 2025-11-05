// controllers/fornecedorAnexosController.js
const FornecedorAnexos = require('../models/FornecedorAnexos');

const listar = async (req, res) => {
  try {
    const anexos = await FornecedorAnexos.findAll();
    res.status(200).json(anexos);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao listar anexos', erro: error.message });
  }
};

const criar = async (req, res) => {
  try {
    const { fornecedorId, nomeArquivo } = req.body;
    if (!fornecedorId || !nomeArquivo) {
      return res.status(400).json({ mensagem: 'Campos obrigatórios: fornecedorId e nomeArquivo' });
    }
    const novoAnexo = await FornecedorAnexos.create(req.body);
    res.status(201).json(novoAnexo);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao criar anexo', erro: error.message });
  }
};

const excluir = async (req, res) => {
  try {
    const { id } = req.params;
    const anexo = await FornecedorAnexos.findByPk(id);
    if (!anexo) return res.status(404).json({ mensagem: 'Anexo não encontrado' });
    await anexo.destroy();
    res.status(200).json({ mensagem: 'Anexo excluído com sucesso (soft delete)' });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao excluir anexo', erro: error.message });
  }
};

module.exports = { listar, criar, excluir };
