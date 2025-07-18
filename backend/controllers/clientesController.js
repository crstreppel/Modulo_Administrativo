const Clientes = require('../models/Clientes');
const Status = require('../models/Status');

module.exports = {
  async criar(req, res) {
    try {
      const {
        nome,
        telefone,
        endereco,
        numero,
        complemento,
        bairro,
        cep,
        cpf,
        aceitaLembreteBanho,
        clienteEsporadico,
        dataConversaoParaFixo,
        link_maps,
      } = req.body;

      if (!nome || !telefone) {
        return res.status(400).json({ erro: 'Nome e telefone são obrigatórios.' });
      }

      const cliente = await Clientes.create({
        nome,
        telefone,
        endereco: endereco || '',
        numero: numero || '',
        complemento: complemento || '',
        bairro: bairro || '',
        cidade: 'Igrejinha',
        estado: 'RS',
        pais: 'Brasil',
        cep: cep || '',
        cpf: cpf || '',
        aceitaLembreteBanho: aceitaLembreteBanho ?? false,
        clienteEsporadico: clienteEsporadico ?? false,
        dataConversaoParaFixo: dataConversaoParaFixo || null,
        link_maps: link_maps || '',
        statusId: 1, // fixo sempre
      });

      const clienteComStatus = await Clientes.findByPk(cliente.id, {
        include: [{ model: Status, as: 'status' }],
      });

      return res.status(201).json(clienteComStatus);
    } catch (erro) {
      console.error('Erro ao cadastrar cliente:', erro);
      return res.status(500).json({ erro: 'Erro ao cadastrar cliente.', detalhe: erro.message });
    }
  },

  async listar(req, res) {
    try {
      const clientes = await Clientes.findAll({
        where: { deletedAt: null },
        include: [{ model: Status, as: 'status' }],
        order: [['createdAt', 'DESC']],
      });
      return res.status(200).json(clientes);
    } catch (erro) {
      console.error('Erro ao buscar clientes:', erro);
      return res.status(500).json({ erro: 'Erro ao buscar clientes.', detalhe: erro.message });
    }
  },

  async atualizar(req, res) {
    try {
      const id = req.params.id;
      const dadosAtualizados = req.body;

      const cliente = await Clientes.findByPk(id);
      if (!cliente) {
        return res.status(404).json({ erro: 'Cliente não encontrado.' });
      }

      await cliente.update(dadosAtualizados);

      const clienteAtualizado = await Clientes.findByPk(id, {
        include: [{ model: Status, as: 'status' }],
      });

      return res.status(200).json(clienteAtualizado);
    } catch (erro) {
      console.error('Erro ao atualizar cliente:', erro);
      return res.status(500).json({ erro: 'Erro ao atualizar cliente.', detalhe: erro.message });
    }
  },

  async excluir(req, res) {
    try {
      const id = req.params.id;

      const cliente = await Clientes.findByPk(id);
      if (!cliente) {
        return res.status(404).json({ erro: 'Cliente não encontrado.' });
      }

      await cliente.destroy();
      return res.status(200).json({ mensagem: 'Cliente excluído com sucesso.' });
    } catch (erro) {
      console.error('Erro ao excluir cliente:', erro);
      return res.status(500).json({ erro: 'Erro ao excluir cliente.', detalhe: erro.message });
    }
  },
};
