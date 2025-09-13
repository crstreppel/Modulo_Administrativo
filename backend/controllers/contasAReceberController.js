// controllers/contasAReceberController.js
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');

const ContasAReceber = require('../models/ContasAReceber');
const Clientes = require('../models/Clientes');
const Movimentos = require('../models/Movimentos');
const Status = require('../models/Status');

const EPS = 0.01; // tolerância de centavos

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

    await conta.destroy();

    res.status(200).json({ mensagem: 'Conta a receber excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir conta a receber:', error);
    res.status(500).json({ erro: 'Erro ao excluir conta a receber.' });
  }
};

/**
 * LIQUIDAR TÍTULO (parcial/total com salvaguardas)
 * Body:
 * {
 *   "dataPagamento": "YYYY-MM-DD",
 *   "meioPagamentoId": 1,
 *   "valorPago": 123.45,       // bruto informado (obrigatório na parcial; na total pode vir omitido)
 *   "desconto": 0,             // opcional
 *   "acrescimo": 0,            // opcional
 *   "obs": "texto",            // opcional
 *   "tipoBaixa": "parcial" | "total"  // se ausente, o back infere
 * }
 */
const liquidarContaReceber = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      dataPagamento,
      meioPagamentoId,
      valorPago,     // bruto digitado
      desconto = 0,
      acrescimo = 0,
      obs,
      tipoBaixa,     // 'parcial' | 'total'
    } = req.body || {};

    // 1) Busca a conta com lock, SEM include (evita LEFT OUTER JOIN ... FOR UPDATE)
    const conta = await ContasAReceber.findByPk(id, {
      transaction: t,
      lock: t.LOCK.UPDATE
    });
    if (!conta) {
      await t.rollback();
      return res.status(404).json({ erro: 'Conta a receber não encontrada.' });
    }

    // 2) Buscar IDs dos status relevantes (uma vez, dentro da transação)
    const [statusLiquidado, statusAbertoParcial, statusCancelado, statusEstornado] = await Promise.all([
      Status.findOne({ where: { descricao: { [Op.iLike]: 'liquidado' } }, transaction: t }),
      Status.findOne({ where: { descricao: { [Op.iLike]: 'aberto parcial' } }, transaction: t }),
      Status.findOne({ where: { descricao: { [Op.iLike]: 'cancelado' } }, transaction: t }),
      Status.findOne({ where: { descricao: { [Op.iLike]: 'estornado' } }, transaction: t }),
    ]);

    if (!statusLiquidado || !statusAbertoParcial) {
      await t.rollback();
      return res.status(500).json({ erro: 'Status "Liquidado" ou "Aberto Parcial" não encontrados. Padronize a tabela Status.' });
    }

    // 3) Bloqueios por estado atual (comparando por ID)
    const bloqueados = new Map([
      [statusLiquidado?.id, statusLiquidado?.descricao],
      [statusCancelado?.id, statusCancelado?.descricao],
      [statusEstornado?.id, statusEstornado?.descricao],
    ]);

    if (bloqueados.has(conta.statusId)) {
      const desc = bloqueados.get(conta.statusId) || 'indisponível';
      await t.rollback();
      return res.status(400).json({ erro: `Título já está em estado "${desc}".` });
    }

    // 4) Cálculos de saldo
    const valorOriginal = Number(conta.valorOriginal || 0);
    const pagoAcum = Number(conta.valorPago || 0);
    const saldo = Math.max(0, valorOriginal - pagoAcum);

    if (saldo <= EPS) {
      await t.rollback();
      return res.status(400).json({ erro: 'Título já está praticamente quitado.' });
    }

    const bruto = Number(valorPago || 0);
    const descNum = Number(desconto || 0);
    const acrNum = Number(acrescimo || 0);

    const efetivo = Math.max(0, (bruto - descNum) + acrNum);
    const dataPg = dataPagamento ? new Date(dataPagamento) : new Date();

    // 5) Definir tipo (se não vier do front)
    const tipo = (tipoBaixa === 'parcial' || tipoBaixa === 'total')
      ? tipoBaixa
      : (efetivo + EPS >= saldo ? 'total' : 'parcial');

    // 6) Aplicar regras
    if (tipo === 'parcial') {
      if (efetivo <= 0) {
        await t.rollback();
        return res.status(400).json({ erro: 'Valor efetivo da parcial precisa ser maior que zero.' });
      }
      if (efetivo + EPS >= saldo) {
        await t.rollback();
        return res.status(409).json({ erro: 'Este valor quita o título. Use a aba/ação de Baixa TOTAL.' });
      }

      const novoPago = Math.min(valorOriginal, pagoAcum + efetivo);
      await conta.update({
        dataPagamento: dataPg,
        valorPago: novoPago,
        statusId: statusAbertoParcial.id,
        meioPagamentoId: meioPagamentoId || conta.meioPagamentoId,
        observacoes: gerarObs(conta.observacoes, {
          tipo: 'Parcial',
          bruto, desconto: descNum, acrescimo: acrNum, efetivo,
          dataPg, meioPagamentoId
        })
      }, { transaction: t });

    } else { // total
      const efetivoTotal = Math.max(0, (saldo - descNum) + acrNum);
      if (efetivoTotal + EPS < saldo) {
        await t.rollback();
        return res.status(409).json({ erro: 'Este valor não quita o título. Use Baixa PARCIAL ou ajuste desconto/juros.' });
      }

      await conta.update({
        dataPagamento: dataPg,
        valorPago: valorOriginal, // zera o saldo
        statusId: statusLiquidado.id,
        meioPagamentoId: meioPagamentoId || conta.meioPagamentoId,
        observacoes: gerarObs(conta.observacoes, {
          tipo: 'Total',
          bruto: (bruto || saldo), desconto: descNum, acrescimo: acrNum, efetivo: efetivoTotal,
          dataPg, meioPagamentoId
        })
      }, { transaction: t });
    }

    await t.commit();

    // 7) Buscar novamente com includes para retornar completo
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
    res.status(500).json({ erro: 'Erro ao liquidar conta a receber.' });
  }
};

// Gera um trecho de observação legível, sem quebrar o que já existe
function gerarObs(obsAnterior, { tipo, bruto, desconto, acrescimo, efetivo, dataPg, meioPagamentoId }) {
  const pad = (n) => (Number(n) || 0).toFixed(2);
  const d = dataPg instanceof Date ? dataPg.toISOString().slice(0,10) : String(dataPg || '');
  const p = `[Baixa ${tipo}] bruto=${pad(bruto)} desc=${pad(desconto)} acr=${pad(acrescimo)} efetivo=${pad(efetivo)} data=${d}${meioPagamentoId ? ` meio=${meioPagamentoId}` : ''}`;
  return obsAnterior ? `${obsAnterior} | ${p}` : p;
}

/**
 * CANCELAR TÍTULO
 * Body (opcional): { "obs": "motivo do cancelamento" }
 */
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

    const statusCancelado = await Status.findOne({
      where: { descricao: { [Op.iLike]: 'cancelado' } }
    });
    if (!statusCancelado) {
      return res.status(500).json({ erro: 'Status "Cancelado" não encontrado. Cadastre/Padronize os Status.' });
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

/**
 * PRORROGAR (alterar vencimento)
 * Body: { "novaDataVencimento": "YYYY-MM-DD", "obs": "opcional" }
 */
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
