// controllers/fornecedorDadosBancariosController.js
const FornecedorDadosBancarios = require('../models/FornecedorDadosBancarios');

const listar = async (req, res) => {
  try {
    const bancos = await FornecedorDadosBancarios.findAll();
    res.status(200).json(bancos);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao listar dados bancários', erro: error.message });
  }
};

const criar = async (req, res) => {
  try {
    const { fornecedorId } = req.body;
    if (!fornecedorId) return res.status(400).json({ mensagem: 'fornecedorId é obrigatório' });
    const novoBanco = await FornecedorDadosBancarios.create(req.body);
    res.status(201).json(novoBanco);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao criar dados bancários', erro: error.message });
  }
};

const atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const banco = await FornecedorDadosBancarios.findByPk(id);
    if (!banco) return res.status(404).json({ mensagem: 'Registro não encontrado' });
    await banco.update(req.body);
    res.status(200).json({ mensagem: 'Dados bancários atualizados com sucesso', banco });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao atualizar dados bancários', erro: error.message });
  }
};

const excluir = async (req, res) => {
  try {
    const { id } = req.params;
    const banco = await FornecedorDadosBancarios.findByPk(id);
    if (!banco) return res.status(404).json({ mensagem: 'Registro não encontrado' });
    await banco.destroy();
    res.status(200).json({ mensagem: 'Dados bancários excluídos com sucesso (soft delete)' });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao excluir dados bancários', erro: error.message });
  }
};

module.exports = { listar, criar, atualizar, excluir };
