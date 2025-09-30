// === controller: movimentosController.js ===
// v2.2.0 — Ajuste: permite baixa parcial de adiantamento (bloqueia só saldo = 0)

const Movimentos = require('../models/Movimentos');
const Clientes = require('../models/Clientes');
const Pets = require('../models/Pets');
const Servicos = require('../models/Servicos');
const CondicaoPagamento = require('../models/CondicaoDePagamento');
const MeioPagamento = require('../models/MeioDePagamento');
const TabelaDePrecos = require('../models/TabelaDePrecos');
const Status = require('../models/Status');
const { Op } = require('sequelize');

/**
 * Regra GLOBAL (retroativo):
 * - data_lancamento = sempre do servidor (CURRENT_DATE) e usada só para AUDITORIA.
 * - TODOS os cálculos de negócio (parcelas/vencimentos de títulos) ocorrem em contas_a_receber via trigger,
 *   sempre baseados em data_movimento. Movimentos NÃO guardam vencimento.
 * - Se a UI ainda enviar apenas "data_lancamento", o backend mapeia para data_movimento.
 */

/**
 * Regra de status:
 * - À vista (1)             => statusId = 2 (ABERTO)
 * - Adiantamento (3)        => statusId = 5 (LIQUIDADO)
 * - A prazo (qualquer outro)=> statusId = 2 (ABERTO)
 */
function aplicarRegraStatusByCondicao(condicaoPagamentoId) {
  const cp = Number(condicaoPagamentoId);
  if (cp === 3) return 5; // adiantamento nasce liquidado
  return 2;               // à vista e a prazo nascem abertos
}

/**
 * Helper: saldo de adiantamento do PET
 * Saldo = entradas (cond=3, meio != 3) - baixas (cond=3, meio = 3)
 */
async function getSaldoAdiantamentoPet(petId) {
  const entradas =
    (await Movimentos.sum('valor', {
      where: {
        petId,
        condicaoPagamentoId: 3,
        meioPagamentoId: { [Op.ne]: 3 },
      },
    })) || 0;

  const baixas =
    (await Movimentos.sum('valor', {
      where: {
        petId,
        condicaoPagamentoId: 3,
        meioPagamentoId: 3,
      },
    })) || 0;

  return Number(entradas) - Number(baixas);
}

/**
 * GET /movimentos/listar
 */
const listarMovimentos = async (req, res) => {
  try {
    const movimentos = await Movimentos.findAll({
      include: [
        { model: Clientes, as: 'cliente' },
        { model: Pets, as: 'pet' },
        { model: Servicos, as: 'servico' },
        { model: CondicaoPagamento, as: 'condicaoPagamento' },
        { model: MeioPagamento, as: 'meioDePagamento' },
        { model: Status, as: 'status' },
        { model: TabelaDePrecos, as: 'tabelaDePreco' },
      ],
      order: [['data_lancamento', 'ASC'], ['id', 'ASC']],
    });
    res.status(200).json(movimentos);
  } catch (error) {
    console.error('Erro ao listar movimentos:', error);
    res.status(500).json({ erro: 'Erro ao buscar movimentos.' });
  }
};

/**
 * GET /movimentos/relatorio
 */
const relatorioMovimentos = async (req, res) => {
  try {
    const {
      dataInicio,
      dataFim,
      clienteId,
      petId,
      servicoId,
      condicaoPagamentoId,
      meioPagamentoId,
      statusId,
    } = req.query;

    const hoje = new Date().toISOString().split('T')[0];
    const di = dataInicio || dataFim || hoje;
    const df = dataFim || dataInicio || hoje;

    const where = { data_lancamento: { [Op.between]: [di, df] } };
    if (clienteId) where.clienteId = clienteId;
    if (petId) where.petId = petId;
    if (servicoId) where.servicoId = servicoId;
    if (condicaoPagamentoId) where.condicaoPagamentoId = condicaoPagamentoId;
    if (meioPagamentoId) where.meioPagamentoId = meioPagamentoId;
    if (statusId) where.statusId = statusId;

    const movimentos = await Movimentos.findAll({
      where,
      attributes: [
        'id',
        'data_lancamento',
        'data_movimento',
        'valor',
        'observacao',
        'adiantamentoId',
      ],
      include: [
        { model: Clientes, as: 'cliente', attributes: ['nome'] },
        { model: Pets, as: 'pet', attributes: ['nome'] },
        { model: Servicos, as: 'servico', attributes: ['descricao'] },
        {
          model: CondicaoPagamento,
          as: 'condicaoPagamento',
          attributes: ['id', 'descricao'],
        },
        {
          model: MeioPagamento,
          as: 'meioDePagamento',
          attributes: ['id', 'descricao'],
        },
        { model: Status, as: 'status', attributes: ['descricao'] },
      ],
      order: [['data_lancamento', 'ASC'], ['id', 'ASC']],
    });

    return res.status(200).json({
      filtrosAplicados: {
        dataInicio: di,
        dataFim: df,
        clienteId,
        petId,
        servicoId,
        condicaoPagamentoId,
        meioPagamentoId,
        statusId,
      },
      total: movimentos.length,
      data: movimentos,
    });
  } catch (err) {
    console.error('Erro ao gerar relatório de movimentos:', err);
    return res.status(500).json({ erro: 'Falha ao gerar relatório.' });
  }
};

/**
 * GET /movimentos/listar-por-periodo
 */
const listarParaConferencia = async (req, res) => {
  try {
    const {
      dataInicio,
      dataFim,
      clienteId,
      petId,
      servicoId,
      condicaoPagamentoId,
      meioPagamentoId,
      statusId,
      limit,
      offset,
    } = req.query;

    const hoje = new Date().toISOString().split('T')[0];
    const di = dataInicio || dataFim || hoje;
    const df = dataFim || dataInicio || hoje;

    const where = { data_lancamento: { [Op.between]: [di, df] } };
    if (clienteId) where.clienteId = clienteId;
    if (petId) where.petId = petId;
    if (servicoId) where.servicoId = servicoId;
    if (condicaoPagamentoId) where.condicaoPagamentoId = condicaoPagamentoId;
    if (meioPagamentoId) where.meioPagamentoId = meioPagamentoId;
    if (statusId) where.statusId = statusId;

    const movimentos = await Movimentos.findAll({
      where,
      attributes: ['id', 'data_lancamento', 'data_movimento', 'valor', 'observacao'],
      include: [
        { model: Clientes, as: 'cliente', attributes: ['id', 'nome'] },
        { model: Pets, as: 'pet', attributes: ['id', 'nome'] },
        { model: Servicos, as: 'servico', attributes: ['id', 'descricao'] },
        { model: CondicaoPagamento, as: 'condicaoPagamento', attributes: ['id', 'descricao'] },
        { model: MeioPagamento, as: 'meioDePagamento', attributes: ['id', 'descricao'] },
        { model: Status, as: 'status', attributes: ['id', 'descricao'] },
      ],
      order: [['data_lancamento', 'ASC'], ['id', 'ASC']],
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });

    const data = movimentos.map((m) => ({
      id: m.id,
      dataLancamento: m.data_lancamento,
      dataMovimento: m.data_movimento,
      clienteId: m.cliente?.id ?? null,
      cliente: m.cliente?.nome ?? null,
      petId: m.pet?.id ?? null,
      pet: m.pet?.nome ?? null,
      servicoId: m.servico?.id ?? null,
      servico: m.servico?.descricao ?? null,
      valor: m.valor,
      condicaoPagamentoId: m.condicaoPagamento?.id ?? null,
      condicaoPagamento: m.condicaoPagamento?.descricao ?? null,
      meioPagamentoId: m.meioDePagamento?.id ?? null,
      meioPagamento: m.meioDePagamento?.descricao ?? null,
      statusId: m.status?.id ?? null,
      status: m.status?.descricao ?? null,
      observacao: m.observacao ?? null,
    }));

    return res.status(200).json({
      filtrosAplicados: {
        dataInicio: di,
        dataFim: df,
        clienteId,
        petId,
        servicoId,
        condicaoPagamentoId,
        meioPagamentoId,
        statusId,
      },
      total: data.length,
      data,
    });
  } catch (err) {
    console.error('Erro ao listar movimentos para conferência:', err);
    return res.status(500).json({ erro: 'Falha ao listar movimentos para conferência.' });
  }
};

/**
 * POST /movimentos
 */
const criarMovimento = async (req, res) => {
  try {
    const {
      data_movimento,
      data_lancamento,
      clienteId,
      petId,
      servicoId,
      valor,
      condicaoPagamentoId,
      meioPagamentoId,
      data_liquidacao,
      observacao,
      tabelaDePrecosId,
    } = req.body;

    if (!clienteId || !petId || !servicoId || !condicaoPagamentoId) {
      return res.status(400).json({ erro: 'Campos obrigatórios ausentes.' });
    }

    const hojeISO = new Date().toISOString().split('T')[0];

    const dataDigitada = data_movimento || data_lancamento || null;
    const dataEvento = dataDigitada
      ? new Date(dataDigitada).toISOString().split('T')[0]
      : hojeISO;

    let condicaoId = Number(condicaoPagamentoId);
    let valorServico =
      valor !== undefined && valor !== null ? parseFloat(valor) : 0;

    if (tabelaDePrecosId) {
      const tabela = await TabelaDePrecos.findByPk(tabelaDePrecosId);
      if (!tabela) return res.status(400).json({ erro: 'Tabela de preços não encontrada.' });
      if (!valor || parseFloat(valor) === 0) {
        valorServico = parseFloat(tabela.valorServico || tabela.preco || 0);
      }
      condicaoId = Number(tabela.condicaoDePagamentoId ?? condicaoId);
    }

    let meioId = null;
    if (condicaoId === 1 || condicaoId === 3) {
      if (!meioPagamentoId) {
        return res.status(400).json({ erro: 'Para À VISTA/ADIANTAMENTO, o meio de pagamento é obrigatório.' });
      }
      meioId = Number(meioPagamentoId);
    } else {
      meioId = null;
    }

    // Validação de baixa de adiantamento: só bloqueia se saldo = 0
    if (condicaoId === 3 && meioId === 3) {
      const saldo = await getSaldoAdiantamentoPet(Number(petId));
      if (saldo <= 0) {
        return res.status(400).json({
          erro: 'Não é possível lançar a baixa de adiantamento: o saldo de adiantamento do pet está zerado.',
        });
      }
    }

    let data_liquidacao_calc = data_liquidacao || null;
    if (condicaoId === 3) {
      data_liquidacao_calc = dataEvento;
    }

    const statusId = aplicarRegraStatusByCondicao(condicaoId);

    const movimento = await Movimentos.create({
      data_movimento: dataEvento,
      clienteId,
      petId,
      servicoId,
      valor: valorServico,
      condicaoPagamentoId: condicaoId,
      meioPagamentoId: meioId,
      data_liquidacao: data_liquidacao_calc,
      observacao: observacao || null,
      statusId,
      tabelaDePrecosId: tabelaDePrecosId || null,
    });

    return res.status(201).json(movimento);
  } catch (error) {
    console.error('Erro ao criar movimento:', error);
    return res.status(500).json({ erro: 'Erro ao criar movimento.' });
  }
};

/**
 * PUT /movimentos/:id
 */
const atualizarMovimento = async (req, res) => {
  const { id } = req.params;
  try {
    const {
      data_movimento,
      data_lancamento,
      clienteId,
      petId,
      servicoId,
      valor,
      condicaoPagamentoId,
      meioPagamentoId,
      data_liquidacao,
      observacao,
      tabelaDePrecosId,
    } = req.body;

    const movimento = await Movimentos.findByPk(id);
    if (!movimento) return res.status(404).json({ erro: 'Movimento não encontrado.' });

    let condicaoId = Number(condicaoPagamentoId ?? movimento.condicaoPagamentoId);
    let valorFinal =
      valor !== undefined && valor !== null ? parseFloat(valor) : Number(movimento.valor);

    if (tabelaDePrecosId) {
      const tabela = await TabelaDePrecos.findByPk(tabelaDePrecosId);
      if (!tabela) return res.status(400).json({ erro: 'Tabela de preços não encontrada.' });
      if (!valor || parseFloat(valor) === 0) {
        valorFinal = parseFloat(tabela.valorServico || tabela.preco || 0);
      }
      condicaoId = Number(tabela.condicaoDePagamentoId ?? condicaoId);
    }

    let meioId = null;
    if (condicaoId === 1 || condicaoId === 3) {
      if (!meioPagamentoId && !movimento.meioPagamentoId) {
        return res.status(400).json({ erro: 'Para À VISTA/ADIANTAMENTO, o meio de pagamento é obrigatório.' });
      }
      meioId = Number(meioPagamentoId ?? movimento.meioPagamentoId);
    } else {
      meioId = null;
    }

    // Validação de baixa de adiantamento: só bloqueia se saldo = 0
    const petParaValidar = Number(petId ?? movimento.petId);
    if (condicaoId === 3 && meioId === 3) {
      const saldo = await getSaldoAdiantamentoPet(petParaValidar);
      if (saldo <= 0) {
        return res.status(400).json({
          erro: 'Não é possível atualizar para baixa de adiantamento: o saldo de adiantamento do pet está zerado.',
        });
      }
    }

    const dataDigitada =
      data_movimento ||
      data_lancamento ||
      movimento.data_movimento ||
      movimento.data_lancamento;
    const dataEvento = new Date(dataDigitada).toISOString().split('T')[0];

    let liquidacaoFinal =
      data_liquidacao ?? movimento.data_liquidacao ?? null;
    if (condicaoId === 3) {
      liquidacaoFinal = dataEvento;
    } else if (condicaoId === 1) {
      if (data_liquidacao === null) {
        liquidacaoFinal = null;
      }
    }

    const statusId = aplicarRegraStatusByCondicao(condicaoId);

    await movimento.update({
      data_movimento: dataEvento,
      clienteId: clienteId ?? movimento.clienteId,
      petId: petId ?? movimento.petId,
      servicoId: servicoId ?? movimento.servicoId,
      valor: valorFinal,
      condicaoPagamentoId: condicaoId,
      meioPagamentoId: meioId,
      data_liquidacao: liquidacaoFinal,
      observacao: observacao !== undefined ? observacao : movimento.observacao,
      statusId,
      tabelaDePrecosId:
        tabelaDePrecosId !== undefined ? tabelaDePrecosId : movimento.tabelaDePrecosId,
    });

    return res.status(200).json(movimento);
  } catch (error) {
    console.error('Erro ao atualizar movimento:', error);
    return res.status(500).json({ erro: 'Erro ao atualizar movimento.' });
  }
};

const deletarMovimento = async (req, res) => {
  const { id } = req.params;
  try {
    const movimento = await Movimentos.findByPk(id);
    if (!movimento) return res.status(404).json({ erro: 'Movimento não encontrado.' });

    await movimento.destroy();
    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar movimento:', error);
    return res.status(500).json({ erro: 'Erro ao deletar movimento.' });
  }
};

module.exports = {
  listarMovimentos,
  relatorioMovimentos,
  listarParaConferencia,
  criarMovimento,
  atualizarMovimento,
  deletarMovimento,
};
