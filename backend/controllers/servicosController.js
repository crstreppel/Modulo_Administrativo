// backend/controllers/servicosController.js

const Servicos = require('../models/Servicos');
const Status = require('../models/Status');

module.exports = {
  async criarServico(req, res) {
    try {
      const { descricao, statusId } = req.body;
      console.log('Requisição recebida:', req.body);

      if (!descricao || !statusId) {
        return res.status(400).json({ erro: 'Descrição e statusId são obrigatórios.' });
      }

      const novoServico = await Servicos.create({ descricao, statusId });
      const status = await Status.findByPk(statusId);

      res.status(201).json({ ...novoServico.toJSON(), status });
    } catch (error) {
      console.error('Erro ao criar serviço:', error);
      res.status(500).json({ erro: 'Erro ao criar serviço.', detalhes: error.message });
    }
  },

  async listarServicos(req, res) {
    try {
      const servicos = await Servicos.findAll({
        include: { model: Status, attributes: ['descricao'] },
      });
      res.json(servicos);
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao listar serviços.', detalhes: error.message });
    }
  },

  async atualizarServico(req, res) {
    try {
      const { id } = req.params;
      const { descricao, statusId } = req.body;

      const servico = await Servicos.findByPk(id);
      if (!servico) {
        return res.status(404).json({ erro: 'Serviço não encontrado.' });
      }

      servico.descricao = descricao || servico.descricao;
      servico.statusId = statusId || servico.statusId;
      await servico.save();

      res.json(servico);
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao atualizar serviço.', detalhes: error.message });
    }
  },

  async excluirServico(req, res) {
    try {
      const { id } = req.params;

      const servico = await Servicos.findByPk(id);
      if (!servico) {
        return res.status(404).json({ erro: 'Serviço não encontrado.' });
      }

      await servico.destroy();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao excluir serviço.', detalhes: error.message });
    }
  }
};
