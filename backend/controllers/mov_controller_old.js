// === controller: movimentosController.js ===

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
 * Regra de status:
 * - À vista (1) ou Adiantamento (3) => statusId = 5
 * - A prazo (qualquer outro) => statusId = 2
 */
function aplicarRegraStatusByCondicao(condicaoPagamentoId) {
  const cp = Number(condicaoPagamentoId);
  if (cp === 1 || cp === 3) return 5;
  return 2;
}

/** Util: calcula vencimento padrão
 * - cond=2 => dia 10 do mês seguinte
 * - outros => data_lancamento
 */
function calcularVencimentoPadrao(condicaoPagamentoId, data_lancamento) {
  const cp = Number(condicaoPagamentoId);
  if (!data_lancamento) return null;
  if (cp === 2) {
    const lanc = new Date(data_lancamento);
    lanc.setMonth(lanc.getMonth() + 1);
    lanc.setDate(10);
    return lanc.toISOString().split('T')[0];
  }
  return data_lancamento;
}

/**
 * Helper: saldo de adiantamento do PET
 * Saldo = entradas (cond=3, meio != 3) - baixas (cond=3, meio = 3)
 */
async function getSaldoAdiantamentoPet(petId) {
  const entradas = (await Movimentos.sum('valor', {
    where: {
      petId,
      condicaoPagamentoId: 3,
      meioPagamentoId: { [Op.ne]: 3 },
    },
  })) || 0;

  const baixas = (await Movimentos.sum('valor', {
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
      statusId
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
        'adiantamentoId'
      ],
      include: [
        { model: Clientes, as: 'cliente', attributes: ['nome'] },
        { model: Pets, as: 'pet', attributes: ['nome'] },
        { model: Servicos, as: 'servico', attributes: ['descricao'] },
        { model: CondicaoPagamento, as: 'condicaoPagamento', attributes: ['id', 'descricao'] },
        { model: MeioPagamento, as: 'meioDePagamento', attributes: ['id', 'descricao'] },
        { model: Status, as: 'status', attributes: ['descricao'] }
      ],
      order: [['data_lancamento', 'ASC'], ['id', 'ASC']]
    });

    return res.status(200).json({
      filtrosAplicados: { dataInicio: di, dataFim: df, clienteId, petId, servicoId, condicaoPagamentoId, meioPagamentoId, statusId },
      total: movimentos.length,
      data: movimentos
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
      attributes: ['id','data_lancamento','data_movimento','valor','observacao'],
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

    const data = movimentos.map(m => ({
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
      filtrosAplicados: { dataInicio: di, dataFim: df, clienteId, petId, servicoId, condicaoPagamentoId, meioPagamentoId, statusId },
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
 * Regras:
 *  - cond=1 ou 3 => exige e grava meioPagamentoId; liquida no dia (data_movimento || data_lancamento)
 *  - a prazo => meioPagamentoId = null
 *  - se vier tabelaDePrecosId, usa condicao e valor de lá quando valor não informado/zero
 *  - valida saldo: cond=3 & meio=3
 *    - saldo <= 0 => 400 com mensagem
 *    - 0 < saldo < valor => 409 com payload detalhado p/ UI decidir fluxo
 */
const criarMovimento = async (req, res) => {
  try {
    const {
      data_lancamento,
      data_movimento, // opcional
      clienteId,
      petId,
      servicoId,
      valor,
      condicaoPagamentoId,
      meioPagamentoId,
      data_liquidacao, // opcional (normalmente auto)
      observacao,
      tabelaDePrecosId
    } = req.body;

    if (!data_lancamento || !clienteId || !petId || !servicoId || !condicaoPagamentoId) {
      return res.status(400).json({ erro: 'Campos obrigatórios ausentes.' });
    }

    let condicaoId = condicaoPagamentoId;
    let valorServico = (valor !== undefined && valor !== null) ? parseFloat(valor) : 0;

    // Se vier tabela de preços, prioriza valores/condições dela quando valor não informado/zero
    if (tabelaDePrecosId) {
      const tabela = await TabelaDePrecos.findByPk(tabelaDePrecosId);
      if (!tabela) return res.status(400).json({ erro: 'Tabela de preços não encontrada.' });

      if (!valor || parseFloat(valor) === 0) {
        valorServico = parseFloat(tabela.valorServico || tabela.preco || 0);
      }
      condicaoId = tabela.condicaoDePagamentoId ?? condicaoId;
    }

    const condicaoIdNum = Number(condicaoId);

    // Regra do meio de pagamento
    let meioId = null;
    if (condicaoIdNum === 1 || condicaoIdNum === 3) {
      if (!meioPagamentoId) {
        return res.status(400).json({ erro: 'Para À VISTA/ADIANTAMENTO, o meio de pagamento é obrigatório.' });
      }
      meioId = Number(meioPagamentoId);
    } else {
      meioId = null; // a prazo não define meio de pagamento aqui
    }

    // Validação de saldo para baixa de adiantamento (cond=3 e meio=3)
    if (condicaoIdNum === 3 && meioId === 3) {
      const saldo = await getSaldoAdiantamentoPet(Number(petId));
      const valorNum = Number(valorServico);

      if (saldo <= 0) {
        return res.status(400).json({
          erro: 'Não é possível lançar a baixa de adiantamento: o saldo de adiantamento do pet está zerado ou insuficiente.'
        });
      }

      if (saldo > 0 && saldo < valorNum) {
        const falta = Number((valorNum - saldo).toFixed(2));
        return res.status(409).json({
          erro: 'Saldo de adiantamento insuficiente para cobrir todo o valor.',
          code: 'SALDO_INSUFICIENTE_PARCIAL',
          saldoDisponivel: Number(saldo.toFixed(2)),
          valorSolicitado: Number(valorNum.toFixed(2)),
          falta
        });
      }
    }

    // Datas
    const data_movimento_final = data_movimento || data_lancamento;

    // Vencimento padrão (apoia a trigger de títulos)
    const data_vencimento = calcularVencimentoPadrao(condicaoIdNum, data_lancamento);

    // Liquidação automática para 1 e 3
    let data_liquidacao_calc = data_liquidacao || null;
    if (condicaoIdNum === 1 || condicaoIdNum === 3) {
      data_liquidacao_calc = data_movimento_final || data_lancamento;
    }

    const statusId = aplicarRegraStatusByCondicao(condicaoIdNum);

    const movimento = await Movimentos.create({
      data_lancamento,
      data_movimento: data_movimento_final,
      clienteId,
      petId,
      servicoId,
      valor: valorServico,
      condicaoPagamentoId: condicaoIdNum,
      meioPagamentoId: meioId,
      data_vencimento,
      data_liquidacao: data_liquidacao_calc,
      observacao: observacao || null,
      statusId,
      tabelaDePrecosId: tabelaDePrecosId || null
    });

    return res.status(201).json(movimento);
  } catch (error) {
    console.error('Erro ao criar movimento:', error);
    return res.status(500).json({ erro: 'Erro ao criar movimento.' });
  }
};

/**
 * PUT /movimentos/:id
 * - mantém as regras do POST
 * - valida saldo quando atualização virar baixa (cond=3 e meio=3)
 *   * saldo <= 0 => 400
 *   * 0 < saldo < valor => 409 com payload
 */
const atualizarMovimento = async (req, res) => {
  const { id } = req.params;
  try {
    const {
      data_lancamento,
      data_movimento,
      clienteId,
      petId,
      servicoId,
      valor,
      condicaoPagamentoId,
      meioPagamentoId,
      data_vencimento,
      data_liquidacao,
      observacao,
      tabelaDePrecosId
    } = req.body;

    const movimento = await Movimentos.findByPk(id);
    if (!movimento) return res.status(404).json({ erro: 'Movimento não encontrado.' });

    // Resolve condicao/valor finais (prioriza tabela, se informada)
    let condicaoId = condicaoPagamentoId ?? movimento.condicaoPagamentoId;
    let valorFinal = (valor !== undefined && valor !== null) ? parseFloat(valor) : movimento.valor;

    if (tabelaDePrecosId) {
      const tabela = await TabelaDePrecos.findByPk(tabelaDePrecosId);
      if (!tabela) return res.status(400).json({ erro: 'Tabela de preços não encontrada.' });
      if (!valor || parseFloat(valor) === 0) {
        valorFinal = parseFloat(tabela.valorServico || tabela.preco || 0);
      }
      condicaoId = tabela.condicaoDePagamentoId ?? condicaoId;
    }

    const condicaoIdNum = Number(condicaoId);

    // Regra do meio de pagamento
    let meioId = null;
    if (condicaoIdNum === 1 || condicaoIdNum === 3) {
      if (!meioPagamentoId) {
        return res.status(400).json({ erro: 'Para À VISTA/ADIANTAMENTO, o meio de pagamento é obrigatório.' });
      }
      meioId = Number(meioPagamentoId);
    } else {
      meioId = null;
    }

    // Validação de saldo para baixa de adiantamento (cond=3 e meio=3)
    const petParaValidar = Number(petId ?? movimento.petId);
    if (condicaoIdNum === 3 && meioId === 3) {
      const saldo = await getSaldoAdiantamentoPet(petParaValidar);
      const valorNum = Number(valorFinal);

      if (saldo <= 0) {
        return res.status(400).json({
          erro: 'Não é possível atualizar para baixa de adiantamento: o saldo de adiantamento do pet está zerado ou insuficiente.'
        });
      }

      if (saldo > 0 && saldo < valorNum) {
        const falta = Number((valorNum - saldo).toFixed(2));
        return res.status(409).json({
          erro: 'Saldo de adiantamento insuficiente para cobrir todo o valor.',
          code: 'SALDO_INSUFICIENTE_PARCIAL',
          saldoDisponivel: Number(saldo.toFixed(2)),
          valorSolicitado: Number(valorNum.toFixed(2)),
          falta
        });
      }
    }

    // Datas/vencimento/liquidação (se não informadas, aplica padrão)
    const data_movimento_final = data_movimento || data_lancamento || movimento.data_movimento || movimento.data_lancamento;
    const vencimentoFinal = data_vencimento || calcularVencimentoPadrao(condicaoIdNum, data_lancamento || movimento.data_lancamento);
    let liquidacaoFinal = data_liquidacao ?? movimento.data_liquidacao ?? null;
    if (condicaoIdNum === 1 || condicaoIdNum === 3) {
      liquidacaoFinal = data_movimento_final || data_lancamento || movimento.data_lancamento;
    }

    const statusId = aplicarRegraStatusByCondicao(condicaoIdNum);

    await movimento.update({
      data_lancamento: data_lancamento ?? movimento.data_lancamento,
      data_movimento: data_movimento_final,
      clienteId: clienteId ?? movimento.clienteId,
      petId: petId ?? movimento.petId,
      servicoId: servicoId ?? movimento.servicoId,
      valor: valorFinal,
      condicaoPagamentoId: condicaoIdNum,
      meioPagamentoId: meioId,
      data_vencimento: vencimentoFinal ?? movimento.data_vencimento,
      data_liquidacao: liquidacaoFinal,
      observacao: (observacao !== undefined ? observacao : movimento.observacao),
      statusId,
      tabelaDePrecosId: tabelaDePrecosId ?? movimento.tabelaDePrecosId
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
  deletarMovimento
};
