// backend/controllers/racasController.js

const Racas = require('../models/Racas');
const Status = require('../models/Status');

module.exports = {
  async criarRaca(req, res) {
    try {
      const { descricao, statusId } = req.body;
      console.log('Requisição recebida:', req.body);

      if (!descricao || !statusId) {
        return res.status(400).json({ erro: 'Descrição e statusId são obrigatórios.' });
      }

      const novaRaca = await Racas.create({ descricao, statusId });
      const status = await Status.findByPk(statusId);

      res.status(201).json({ ...novaRaca.toJSON(), status });
    } catch (error) {
      console.error('Erro ao criar raça:', error);
      res.status(500).json({ erro: 'Erro ao criar raça.', detalhes: error.message });
    }
  },

  async listarRacas(req, res) {
    try {
      const racas = await Racas.findAll({
        include: { model: Status, attributes: ['descricao'] },
      });
      res.json(racas);
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao listar raças.', detalhes: error.message });
    }
  },

  async atualizarRaca(req, res) {
    try {
      const { id } = req.params;
      const { descricao, statusId } = req.body;

      const raca = await Racas.findByPk(id);
      if (!raca) {
        return res.status(404).json({ erro: 'Raça não encontrada.' });
      }

      raca.descricao = descricao || raca.descricao;
      raca.statusId = statusId || raca.statusId;
      await raca.save();

      res.json(raca);
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao atualizar raça.', detalhes: error.message });
    }
  },

  async excluirRaca(req, res) {
    try {
      const { id } = req.params;

      const raca = await Racas.findByPk(id);
      if (!raca) {
        return res.status(404).json({ erro: 'Raça não encontrada.' });
      }

      await raca.destroy();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao excluir raça.', detalhes: error.message });
    }
  }
};
