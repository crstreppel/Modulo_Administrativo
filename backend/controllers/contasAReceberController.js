const ContasAReceber = require('../models/ContasAReceber');
const Clientes = require('../models/Clientes');
const Movimentos = require('../models/Movimentos');
const Status = require('../models/Status');

const listarContasAReceber = async (req, res) => {
  try {
    const contas = await ContasAReceber.findAll({
      include: [
        { model: Clientes, as: 'cliente', attributes: ['id', 'nome'] },
        { model: Movimentos, as: 'movimento', attributes: ['id', 'descricao'] },
        { model: Status, as: 'status', attributes: ['id', 'descricao'] }
      ],
      order: [['updatedAt', 'DESC']]
    });

    res.status(200).json(contas);
  } catch (error) {
    console.error('Erro ao listar contas a receber:', error);
    res.status(500).json({ erro: 'Erro ao buscar contas a receber.' });
  }
};

const criarContaReceber = async (req, res) => {
  try {
    const {
      clienteId,
      nomeContato,
      telefoneContato,
      movimentoId,
      dataVencimento,
      valorOriginal,
      statusId,
      observacoes,
      bancoId,
      enviadoProBanco,
      nossoNumero,
      codigoRemessa,
      retornoStatus,
    } = req.body;

    // Validações básicas na lata
    if (!clienteId || !movimentoId || !dataVencimento || !valorOriginal || !statusId) {
      return res.status(400).json({ erro: 'Campos obrigatórios faltando.' });
    }

    const novaConta = await ContasAReceber.create({
      clienteId,
      nomeContato,
      telefoneContato,
      movimentoId,
      dataVencimento,
      valorOriginal,
      valorPago: 0.00,
      statusId,
      observacoes,
      bancoId,
      enviadoProBanco: enviadoProBanco || false,
      nossoNumero,
      codigoRemessa,
      retornoStatus,
    });

    res.status(201).json(novaConta);
  } catch (error) {
    console.error('Erro ao criar conta a receber:', error);
    res.status(500).json({ erro: 'Erro ao criar conta a receber.' });
  }
};

const atualizarContaReceber = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nomeContato,
      telefoneContato,
      dataVencimento,
      dataPagamento,
      valorOriginal,
      valorPago,
      statusId,
      observacoes,
      bancoId,
      enviadoProBanco,
      nossoNumero,
      codigoRemessa,
      retornoStatus,
    } = req.body;

    const conta = await ContasAReceber.findByPk(id);
    if (!conta) {
      return res.status(404).json({ erro: 'Conta a receber não encontrada.' });
    }

    // Atualiza os campos permitidos
    await conta.update({
      nomeContato,
      telefoneContato,
      dataVencimento,
      dataPagamento,
      valorOriginal,
      valorPago,
      statusId,
      observacoes,
      bancoId,
      enviadoProBanco,
      nossoNumero,
      codigoRemessa,
      retornoStatus,
    });

    res.status(200).json(conta);
  } catch (error) {
    console.error('Erro ao atualizar conta a receber:', error);
    res.status(500).json({ erro: 'Erro ao atualizar conta a receber.' });
  }
};

const excluirContaReceber = async (req, res) => {
  try {
    const { id } = req.params;

    const conta = await ContasAReceber.findByPk(id);
    if (!conta) {
      return res.status(404).json({ erro: 'Conta a receber não encontrada.' });
    }

    // Soft delete, graças ao paranoid
    await conta.destroy();

    res.status(200).json({ mensagem: 'Conta a receber excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir conta a receber:', error);
    res.status(500).json({ erro: 'Erro ao excluir conta a receber.' });
  }
};

module.exports = {
  listarContasAReceber,
  criarContaReceber,
  atualizarContaReceber,
  excluirContaReceber,
};
