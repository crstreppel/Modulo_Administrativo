/* =============================================================
 * Controller: fornecedorEnderecosController.js
 * -------------------------------------------------------------
 * Gerado automaticamente pelo PBQE-C Generator v2.6.1
 * ============================================================= */
const FornecedorEnderecos = require('./fornecedorEnderecosModel');
const Fornecedor = require('../../fornecedorModel');
const Status = require('../../../../models/Status');

module.exports = {
  async criar(req, res) {
    try {
      const dados = req.body;
      if (!dados.fornecedorId) {
        return res.status(400).json({ erro: 'Campo fornecedorId é obrigatório.' });
      }
      const novo = await FornecedorEnderecos.create(dados);
      return res.status(201).json(novo);
    } catch (error) {
      console.error('Erro ao criar fornecedorEnderecos:', error);
      return res.status(500).json({ erro: 'Erro interno ao criar registro.' });
    }
  },

  async listar(req, res) {
    try {
      const registros = await FornecedorEnderecos.findAll({
        include: [
          { model: Fornecedor, attributes: ['id', 'razaoSocial', 'nomeFantasia'] },
          { model: Status, attributes: ['id', 'descricao'] }
        ],
        order: [['id', 'ASC']]
      });
      return res.status(200).json(registros);
    } catch (error) {
      console.error('Erro ao listar fornecedorEnderecos:', error);
      return res.status(500).json({ erro: 'Erro interno ao listar registros.' });
    }
  },

  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const dados = req.body;
      const registro = await FornecedorEnderecos.findByPk(id);
      if (!registro) return res.status(404).json({ erro: 'FornecedorEnderecos não encontrado.' });
      await registro.update(dados);
      return res.status(200).json(registro);
    } catch (error) {
      console.error('Erro ao atualizar fornecedorEnderecos:', error);
      return res.status(500).json({ erro: 'Erro interno ao atualizar registro.' });
    }
  },

  async excluir(req, res) {
    try {
      const { id } = req.params;
      const registro = await FornecedorEnderecos.findByPk(id);
      if (!registro) return res.status(404).json({ erro: 'FornecedorEnderecos não encontrado.' });
      await registro.destroy();
      return res.status(200).json({ mensagem: 'FornecedorEnderecos excluído com sucesso.' });
    } catch (error) {
      console.error('Erro ao excluir fornecedorEnderecos:', error);
      return res.status(500).json({ erro: 'Erro interno ao excluir registro.' });
    }
  }
};
