// controllers/contasAReceberController.js
// v2.2.2 — Rollback oficial (modelo histórico preservado)
// - Cancelamento mantém valorPago, dataPagamento e meioPagamentoId
// - Apenas muda status para "Cancelado" e registra observação
// - Mantém consistência contábil: financeiro ignora status 7/8 nas somas

const { Op } = require('sequelize');
const { sequelize } = require('../config/db');

const ContasAReceber = require('../models/ContasAReceber');
const Clientes = require('../models/Clientes');
const Movimentos = require('../models/Movimentos');
const Status = require('../models/Status');

const EPS = 0.01;

const STATUS_IDS = {
  ABERTO: 2,
  LIQUIDADO: 5,
};

const listarContasAReceber = async (req, res) => {
  try {
    const { movimentoId } = req.query;
    const where = {};
    if (movimentoId) where.movimentoId = movimentoId;

    const contas = await ContasAReceber.findAll({
      where,
      include: [
        { model: Clientes, as: 'cliente', attributes: ['id', 'nome'] },
        { model: Movimentos, as: 'movimento', attributes: ['id', 'observacao'] },
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
    const dados = req.body;

    const conta = await ContasAReceber.findByPk(id);
    if (!conta) return res.status(404).json({ erro: 'Conta a receber não encontrada.' });

    await conta.update({
      ...dados,
      meioPagamentoId: dados.meioPagamentoId ?? conta.meioPagamentoId,
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
    if (!conta) return res.status(404).json({ erro: 'Conta a receber não encontrada.' });

    await conta.destroy();
    res.status(200).json({ mensagem: 'Conta a receber excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir conta a receber:', error);
    res.status(500).json({ erro: 'Erro ao excluir conta a receber.' });
  }
};

const liquidarContaReceber = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      dataPagamento,
      meioPagamentoId,
      valorPago,
      desconto = 0,
      acrescimo = 0,
      obs,
      tipoBaixa,
    } = req.body || {};

    const conta = await ContasAReceber.findByPk(id, {
      transaction: t,
      lock: t.LOCK.UPDATE
    });
    if (!conta) {
      await t.rollback();
      return res.status(404).json({ erro: 'Conta a receber não encontrada.' });
    }

    const statusAtual = await Status.findByPk(conta.statusId).catch(() => null);
    if ([STATUS_IDS.LIQUIDADO].includes(conta.statusId)) {
      await t.rollback();
      return res.status(400).json({ erro: `Título já está "${statusAtual?.descricao || conta.statusId}".` });
    }

    const valorOriginal = Number(conta.valorOriginal || 0);
    const pagoAcum = Number(conta.valorPago || 0);
    const saldo = Math.max(0, valorOriginal - pagoAcum);

    if (saldo <= EPS) {
      await t.rollback();
      return res.status(400).json({ erro: 'Título já está quitado.' });
    }

    const bruto = Number(valorPago || saldo);
    const descNum = Number(desconto || 0);
    const acrNum = Number(acrescimo || 0);
    const efetivo = Math.max(0, (bruto - descNum) + acrNum);
    const dataPg = dataPagamento ? new Date(dataPagamento) : new Date();

    const tipo = tipoBaixa || (efetivo + EPS >= saldo ? 'total' : 'parcial');

    if (tipo === 'parcial') {
      if (efetivo <= 0) {
        await t.rollback();
        return res.status(400).json({ erro: 'Valor da parcial precisa ser maior que zero.' });
      }
      const novoPago = Math.min(valorOriginal, pagoAcum + efetivo);
      await conta.update({
        dataPagamento: dataPg,
        valorPago: novoPago,
        statusId: STATUS_IDS.ABERTO,
        meioPagamentoId,
        observacoes: gerarObs(conta.observacoes, {
          tipo: 'Parcial', bruto, desconto: descNum, acrescimo: acrNum, efetivo, dataPg, meioPagamentoId
        })
      }, { transaction: t });
    } else {
      await conta.update({
        dataPagamento: dataPg,
        valorPago: valorOriginal,
        statusId: STATUS_IDS.LIQUIDADO,
        meioPagamentoId,
        observacoes: gerarObs(conta.observacoes, {
          tipo: 'Total', bruto, desconto: descNum, acrescimo: acrNum, efetivo, dataPg, meioPagamentoId
        })
      }, { transaction: t });
    }

    await t.commit();

    const contaAtualizada = await ContasAReceber.findByPk(id, {
      include: [
        { model: Clientes, as: 'cliente', attributes: ['id', 'nome'] },
        { model: Movimentos, as: 'movimento', attributes: ['id', 'observacao'] },
        { model: Status, as: 'status', attributes: ['id', 'descricao'] }
      ]
    });

    res.status(200).json(contaAtualizada);
  } catch (error) {
    console.error('Erro ao liquidar conta a receber:', error);
    try { await t.rollback(); } catch (_) {}
    res.status(500).json({ erro: 'Erro ao liquidar conta a receber.', detalhes: error.message });
  }
};

function gerarObs(obsAnterior, { tipo, bruto, desconto, acrescimo, efetivo, dataPg, meioPagamentoId }) {
  const pad = (n) => (Number(n) || 0).toFixed(2);
  const d = dataPg instanceof Date ? dataPg.toISOString().slice(0,10) : String(dataPg || '');
  const p = `[Baixa ${tipo}] bruto=${pad(bruto)} desc=${pad(desconto)} acr=${pad(acrescimo)} efetivo=${pad(efetivo)} data=${d}${meioPagamentoId ? ` meio=${meioPagamentoId}` : ''}`;
  return obsAnterior ? `${obsAnterior} | ${p}` : p;
}

const cancelarContaReceber = async (req, res) => {
  try {
    const { id } = req.params;
    const { obs } = req.body || {};
    const conta = await ContasAReceber.findByPk(id, {
      include: [{ model: Status, as: 'status', attributes: ['id', 'descricao'] }]
    });
    if (!conta) return res.status(404).json({ erro: 'Conta a receber não encontrada.' });

    const statusAtual = (conta.status && conta.status.descricao || '').toLowerCase();
    if (['liquidado', 'cancelado', 'estornado'].includes(statusAtual)) {
      return res.status(400).json({ erro: `Não é possível cancelar. Título está "${conta.status.descricao}".` });
    }

    const statusCancelado = await Status.findOne({ where: { descricao: { [Op.iLike]: 'cancelado' } } });
    if (!statusCancelado) {
      return res.status(500).json({ erro: 'Status "Cancelado" não encontrado.' });
    }

    await conta.update({
      statusId: statusCancelado.id,
      observacoes: obs
        ? `${conta.observacoes ? conta.observacoes + ' | ' : ''}Cancelado: ${obs}`
        : `${conta.observacoes ? conta.observacoes + ' | ' : ''}Cancelado`
    });

    const contaAtualizada = await ContasAReceber.findByPk(id, {
      include: [
        { model: Clientes, as: 'cliente', attributes: ['id', 'nome'] },
        { model: Movimentos, as: 'movimento', attributes: ['id', 'observacao'] },
        { model: Status, as: 'status', attributes: ['id', 'descricao'] }
      ]
    });

    res.status(200).json(contaAtualizada);
  } catch (error) {
    console.error('Erro ao cancelar conta a receber:', error);
    res.status(500).json({ erro: 'Erro ao cancelar o título.' });
  }
};

const prorrogarContaReceber = async (req, res) => {
  try {
    const { id } = req.params;
    const { novaDataVencimento, obs } = req.body || {};

    if (!novaDataVencimento) {
      return res.status(400).json({ erro: 'Informe a novaDataVencimento no formato YYYY-MM-DD.' });
    }

    const conta = await ContasAReceber.findByPk(id, {
      include: [{ model: Status, as: 'status', attributes: ['id', 'descricao'] }]
    });
    if (!conta) return res.status(404).json({ erro: 'Conta a receber não encontrada.' });

    const statusAtual = (conta.status && conta.status.descricao || '').toLowerCase();
    if (['liquidado', 'cancelado', 'estornado'].includes(statusAtual)) {
      return res.status(400).json({ erro: `Não é possível prorrogar. Título está "${conta.status.descricao}".` });
    }

    await conta.update({
      dataVencimento: novaDataVencimento,
      observacoes: obs
        ? `${conta.observacoes ? conta.observacoes + ' | ' : ''}Prorrogado para ${novaDataVencimento}: ${obs}`
        : `${conta.observacoes ? conta.observacoes + ' | ' : ''}Prorrogado para ${novaDataVencimento}`
    });

    const contaAtualizada = await ContasAReceber.findByPk(id, {
      include: [
        { model: Clientes, as: 'cliente', attributes: ['id', 'nome'] },
        { model: Movimentos, as: 'movimento', attributes: ['id', 'observacao'] },
        { model: Status, as: 'status', attributes: ['id', 'descricao'] }
      ]
    });

    res.status(200).json(contaAtualizada);
  } catch (error) {
    console.error('Erro ao prorrogar conta a receber:', error);
    res.status(500).json({ erro: 'Erro ao prorrogar conta a receber.' });
  }
};

module.exports = {
  listarContasAReceber,
  criarContaReceber,
  atualizarContaReceber,
  excluirContaReceber,
  liquidarContaReceber,
  cancelarContaReceber,
  prorrogarContaReceber,
};
