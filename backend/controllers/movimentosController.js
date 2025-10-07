// === controller: movimentosController.js ===
// v3.1 — Cancelamento via reverso + Relatório reintegrado
// ------------------------------------------------------------
// • Reverso cria movimento de AJUSTE e trigger marca original como CANCELADO
// • Relatório funcional com filtros opcionais
// • Logs padronizados e rastreabilidade garantida
// ------------------------------------------------------------

const Movimentos = require('../models/Movimentos');
const Clientes = require('../models/Clientes');
const Pets = require('../models/Pets');
const Servicos = require('../models/Servicos');
const CondicaoPagamento = require('../models/CondicaoDePagamento');
const MeioPagamento = require('../models/MeioDePagamento');
const TabelaDePrecos = require('../models/TabelaDePrecos');
const Status = require('../models/Status');
const { Op } = require('sequelize');

// --------------------------------------------------------------
// FUNÇÕES AUXILIARES
// --------------------------------------------------------------
function aplicarRegraStatusByCondicao(condicaoPagamentoId) {
  const cp = Number(condicaoPagamentoId);
  if (cp === 3) return 5; // adiantamento nasce liquidado
  return 2;               // à vista e a prazo nascem abertos
}

async function getSaldoAdiantamentoPet(petId) {
  const entradas =
    (await Movimentos.sum('valor', {
      where: { petId, condicaoPagamentoId: 3, meioPagamentoId: { [Op.ne]: 3 } },
    })) || 0;

  const baixas =
    (await Movimentos.sum('valor', {
      where: { petId, condicaoPagamentoId: 3, meioPagamentoId: 3 },
    })) || 0;

  return Number(entradas) - Number(baixas);
}

// --------------------------------------------------------------
// LISTAGENS E RELATÓRIOS
// --------------------------------------------------------------
const listarMovimentos = async (req, res) => {
  try {
    const { data } = req.query;
    const where = {};
    if (data) where.data_movimento = data;

    const movimentos = await Movimentos.findAll({
      where,
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

// --------------------------------------------------------------
// RELATÓRIO DETALHADO DE MOVIMENTOS
// --------------------------------------------------------------
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
      include: [
        { model: Clientes, as: 'cliente', attributes: ['nome'] },
        { model: Pets, as: 'pet', attributes: ['nome'] },
        { model: Servicos, as: 'servico', attributes: ['descricao'] },
        { model: CondicaoPagamento, as: 'condicaoPagamento', attributes: ['descricao'] },
        { model: MeioPagamento, as: 'meioDePagamento', attributes: ['descricao'] },
        { model: Status, as: 'status', attributes: ['descricao'] },
      ],
      order: [['data_lancamento', 'ASC'], ['id', 'ASC']],
    });

    console.log(`📊 Relatório de movimentos gerado: ${movimentos.length} registros.`);

    return res.status(200).json({
      filtrosAplicados: {
        dataInicio: di, dataFim: df, clienteId, petId,
        servicoId, condicaoPagamentoId, meioPagamentoId, statusId,
      },
      total: movimentos.length,
      data: movimentos,
    });
  } catch (err) {
    console.error('Erro ao gerar relatório de movimentos:', err);
    return res.status(500).json({ erro: 'Falha ao gerar relatório.' });
  }
};

// --------------------------------------------------------------
// CRUD PADRÃO (CRIAR / ATUALIZAR / DELETAR)
// --------------------------------------------------------------
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
    const dataEvento = data_movimento || data_lancamento || hojeISO;

    let condicaoId = Number(condicaoPagamentoId);
    let valorServico = parseFloat(valor || 0);

    if (tabelaDePrecosId) {
      const tabela = await TabelaDePrecos.findByPk(tabelaDePrecosId);
      if (!tabela) return res.status(400).json({ erro: 'Tabela de preços não encontrada.' });
      if (!valorServico) valorServico = parseFloat(tabela.valorServico || tabela.preco || 0);
      condicaoId = Number(tabela.condicaoDePagamentoId ?? condicaoId);
    }

    let meioId = (condicaoId === 1 || condicaoId === 3) ? Number(meioPagamentoId) : null;
    if ((condicaoId === 1 || condicaoId === 3) && !meioId)
      return res.status(400).json({ erro: 'Para À VISTA/ADIANTAMENTO, o meio de pagamento é obrigatório.' });

    if (condicaoId === 3 && meioId === 3) {
      const saldo = await getSaldoAdiantamentoPet(Number(petId));
      if (saldo <= 0)
        return res.status(400).json({ erro: 'Saldo de adiantamento do pet está zerado.' });
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
      data_liquidacao,
      observacao,
      statusId,
      tabelaDePrecosId: tabelaDePrecosId || null,
    });

    return res.status(201).json(movimento);
  } catch (error) {
    console.error('Erro ao criar movimento:', error);
    return res.status(500).json({ erro: 'Erro ao criar movimento.' });
  }
};

const atualizarMovimento = async (req, res) => {
  const { id } = req.params;
  try {
    const movimento = await Movimentos.findByPk(id);
    if (!movimento) return res.status(404).json({ erro: 'Movimento não encontrado.' });

    await movimento.update(req.body);
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

// --------------------------------------------------------------
// CANCELAMENTO COM MOVIMENTO REVERSO
// --------------------------------------------------------------
const cancelar = async (req, res) => {
  const { id } = req.params;
  const { motivo } = req.body;

  try {
    const movimento = await Movimentos.findByPk(id);
    if (!movimento) {
      return res.status(404).json({ sucesso: false, mensagem: 'Movimento não encontrado.' });
    }

    if (movimento.statusId === 7) {
      return res.status(400).json({ sucesso: false, mensagem: 'Movimento já está cancelado.' });
    }

    // Cria o movimento reverso (status = AJUSTE)
    const movimentoReverso = await Movimentos.create({
      data_movimento: new Date().toISOString().split('T')[0],
      clienteId: movimento.clienteId,
      petId: movimento.petId,
      servicoId: movimento.servicoId,
      valor: movimento.valor,
      condicaoPagamentoId: movimento.condicaoPagamentoId,
      meioPagamentoId: movimento.meioPagamentoId,
      observacao: `Movimento reverso do movimento #${movimento.id}. Motivo: ${motivo || 'Cancelamento sem motivo informado.'}`,
      statusId: 8, // AJUSTE
      tabelaDePrecosId: movimento.tabelaDePrecosId,
    });

    console.log(`🌀 Criado movimento reverso #${movimentoReverso.id} para o cancelamento do movimento #${id}.`);

    // (Trigger SQL cuidará de marcar o original como CANCELADO)
    return res.status(200).json({
      sucesso: true,
      mensagem: `Movimento #${id} cancelado via reverso #${movimentoReverso.id}.`,
    });
  } catch (error) {
    console.error('Erro ao cancelar movimento (reverso):', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno ao processar cancelamento.',
    });
  }
};

// --------------------------------------------------------------
module.exports = {
  listarMovimentos,
  relatorioMovimentos,
  criarMovimento,
  atualizarMovimento,
  deletarMovimento,
  cancelar,
};
