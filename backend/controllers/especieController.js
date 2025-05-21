const Especie = require('../models/Especie');
const Status = require('../models/Status');

module.exports = {
  async criarEspecie(req, res) {
    try {
      const { descricao, statusId } = req.body;
      console.log('Requisição recebida:', req.body);

      if (!descricao || !statusId) {
        return res.status(400).json({ erro: 'Descrição e statusId são obrigatórios.' });
      }

      const novaEspecie = await Especie.create({ descricao, statusId });
      const status = await Status.findByPk(statusId);

      res.status(201).json({ ...novaEspecie.toJSON(), status });
    } catch (error) {
      console.error('Erro ao criar espécie:', error);
      res.status(500).json({ erro: 'Erro ao criar espécie.', detalhes: error.message });
    }
  },

  async listarEspecies(req, res) {
    try {
      const especies = await Especie.findAll({
  include: {
    model: Status,
    as: 'status'   // <- o alias que você definiu na associação
  }
});
      res.json(especies);
    } catch (error) {
       console.error('Erro ao listar espécies (DETALHADO):', error);  // <-- ADICIONE ESTA LINHA
      res.status(500).json({ erro: 'Erro ao listar espécies.', detalhes: error.message });
    }
  },

  async atualizarEspecie(req, res) {
    try {
      const { id } = req.params;
      const { descricao, statusId } = req.body;

      const especie = await Especie.findByPk(id);
      if (!especie) {
        return res.status(404).json({ erro: 'Espécie não encontrada.' });
      }

      especie.descricao = descricao || especie.descricao;
      especie.statusId = statusId || especie.statusId;
      await especie.save();

      res.json(especie);
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao atualizar espécie.', detalhes: error.message });
    }
  },

  async excluirEspecie(req, res) {
    try {
      const { id } = req.params;

      const especie = await Especie.findByPk(id);
      if (!especie) {
        return res.status(404).json({ erro: 'Espécie não encontrada.' });
      }

      await especie.destroy();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao excluir espécie.', detalhes: error.message });
    }
  }
};
