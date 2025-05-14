// backend/controllers/statusController.js

const Status = require('../models/Status');

module.exports = {
  // Criar novo status
  async criar(req, res) {
    try {
      const { descricao } = req.body;
      const novoStatus = await Status.create({ descricao });
      res.status(201).json(novoStatus);
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao criar status', detalhes: error.message });
    }
  },

  // Listar todos os status (sem os deletados)
  async listar(req, res) {
    try {
      const status = await Status.findAll();
      res.status(200).json(status);
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao listar status', detalhes: error.message });
    }
  },

  // Buscar status por ID
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const status = await Status.findByPk(id);
      if (!status) return res.status(404).json({ erro: 'Status não encontrado' });
      res.status(200).json(status);
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao buscar status', detalhes: error.message });
    }
  },

  // Atualizar status
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { descricao } = req.body;
      const status = await Status.findByPk(id);
      if (!status) return res.status(404).json({ erro: 'Status não encontrado' });

      status.descricao = descricao;
      await status.save();

      res.status(200).json(status);
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao atualizar status', detalhes: error.message });
    }
  },

  // Deletar status (soft delete)
  async deletar(req, res) {
    try {
      const { id } = req.params;
      const status = await Status.findByPk(id);
      if (!status) return res.status(404).json({ erro: 'Status não encontrado' });

      await status.destroy();
      res.status(200).json({ mensagem: 'Status excluído com sucesso' });
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao excluir status', detalhes: error.message });
    }
  }
};
