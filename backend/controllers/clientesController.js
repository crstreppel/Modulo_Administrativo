const Clientes = require('../models/Clientes');
const Status = require('../models/Status');

module.exports = {
  async criarCliente(req, res) {
    try {
      const {
        nome,
        telefone,
        endereco,
        numero,
        bairro,
        cidade,
        estado,
        pais,
        cpf,
        statusId,
        aceitaLembreteBanho,
        redesSociais,
        link_maps // <-- novo campo
      } = req.body;

      console.log('Requisição recebida:', req.body);

      if (!nome || !telefone || !endereco || !numero || !bairro || !cpf || !statusId) {
        return res.status(400).json({ erro: 'Todos os campos obrigatórios devem ser preenchidos.' });
      }

      const novoCliente = await Clientes.create({
        nome,
        telefone,
        endereco,
        numero,
        bairro,
        cidade,
        estado,
        pais,
        cpf,
        statusId,
        aceitaLembreteBanho,
        redesSociais,
        link_maps // <-- salva no banco
      });

      const status = await Status.findByPk(statusId);

      res.status(201).json({ ...novoCliente.toJSON(), status });
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      res.status(500).json({ erro: 'Erro ao criar cliente.', detalhes: error.message });
    }
  },

  async listarClientes(req, res) {
    try {
      const clientes = await Clientes.findAll({
        include: { model: Status, as: 'status', attributes: ['descricao'] },
      });
      res.json(clientes);
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao listar clientes.', detalhes: error.message });
    }
  },

  async atualizarCliente(req, res) {
    try {
      const { id } = req.params;
      const {
        nome,
        telefone,
        endereco,
        numero,
        bairro,
        cidade,
        estado,
        pais,
        cpf,
        statusId,
        aceitaLembreteBanho,
        redesSociais,
        link_maps // <-- novo campo
      } = req.body;

      const cliente = await Clientes.findByPk(id);
      if (!cliente) {
        return res.status(404).json({ erro: 'Cliente não encontrado.' });
      }

      cliente.nome = nome || cliente.nome;
      cliente.telefone = telefone || cliente.telefone;
      cliente.endereco = endereco || cliente.endereco;
      cliente.numero = numero || cliente.numero;
      cliente.bairro = bairro || cliente.bairro;
      cliente.cidade = cidade || cliente.cidade;
      cliente.estado = estado || cliente.estado;
      cliente.pais = pais || cliente.pais;
      cliente.cpf = cpf || cliente.cpf;
      cliente.statusId = statusId || cliente.statusId;
      cliente.aceitaLembreteBanho = aceitaLembreteBanho ?? cliente.aceitaLembreteBanho;
      cliente.redesSociais = redesSociais || cliente.redesSociais;
      cliente.link_maps = link_maps || cliente.link_maps; // <-- atualiza se vier no body

      await cliente.save();

      res.json(cliente);
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao atualizar cliente.', detalhes: error.message });
    }
  },

  async excluirCliente(req, res) {
    try {
      const { id } = req.params;

      const cliente = await Clientes.findByPk(id);
      if (!cliente) {
        return res.status(404).json({ erro: 'Cliente não encontrado.' });
      }

      await cliente.destroy();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao excluir cliente.', detalhes: error.message });
    }
  }
};
