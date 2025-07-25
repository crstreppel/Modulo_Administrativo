const Movimentos = require('../models/Movimentos');
const Clientes = require('../models/Clientes');
const Pets = require('../models/Pets');
const Servicos = require('../models/Servicos');
const CondicaoPagamento = require('../models/CondicaoDePagamento');
const MeioPagamento = require('../models/MeioDePagamento');
const TabelaDePrecos = require('../models/TabelaDePrecos');
const Status = require('../models/Status');
const { Op } = require('sequelize');

// GET: Listar todos os movimentos
const listarMovimentos = async (req, res) => {
  try {
    const movimentos = await Movimentos.findAll({
      include: [
        { model: Clientes, as: 'cliente' },
        { model: Pets, as: 'pet' },
        { model: Servicos, as: 'servico' },
        { model: CondicaoPagamento, as: 'condicaoDePagamento' },
        { model: MeioPagamento, as: 'meioDePagamento' },
        { model: Status, as: 'status' },
        { model: TabelaDePrecos, as: 'tabelaDePreco' }
      ]
    });
    res.status(200).json(movimentos);
  } catch (error) {
    console.error('Erro ao listar movimentos:', error);
    res.status(500).json({ erro: 'Erro ao buscar movimentos.' });
  }
};

// POST: Criar novo movimento
const criarMovimento = async (req, res) => {
  const {
    data_lancamento,
    data_movimento,
    clienteId,
    petId,
    servicoId,
    valor,
    condicaoPagamentoId,
    meioPagamentoId,
    data_liquidacao,
    observacao,
    statusId,
    tabelaDePrecosId
  } = req.body;

  try {
    if (!data_lancamento || !clienteId || !petId || !servicoId || !statusId) {
      return res.status(400).json({ erro: 'Campos obrigatórios ausentes.' });
    }

    let condicaoId = condicaoPagamentoId;
    let meioId = meioPagamentoId;
    let valorServico = parseFloat(valor) || 0;

    // Se tiver tabelaDePrecosId e valor NÃO for informado, puxar da tabela
    if (tabelaDePrecosId) {
      const tabela = await TabelaDePrecos.findByPk(tabelaDePrecosId);
      if (!tabela) {
        return res.status(400).json({ erro: 'Tabela de preços não encontrada.' });
      }

      // Se não veio valor manual, usa o da tabela
      if (!valor || parseFloat(valor) === 0) {
        valorServico = parseFloat(tabela.valorServico || tabela.preco || 0);
      }

      // Sempre sobrescreve condição e meio de pagamento da tabela
      condicaoId = tabela.condicaoDePagamentoId;
      meioId = tabela.meioDePagamentoId;
    }

    // Calcula vencimento com base na condição
    const condicaoIdNum = parseInt(condicaoId);
    let data_vencimento;

    if (condicaoIdNum === 2) {
      const lanc = new Date(data_lancamento);
      lanc.setMonth(lanc.getMonth() + 1);
      lanc.setDate(10);
      data_vencimento = lanc.toISOString().split('T')[0];
    } else {
      data_vencimento = data_lancamento;
    }

    // Se for um pagamento ADIANTADO (condição 3) mas não usando saldo (meio diferente de 3), define data_liquidacao
    let data_liquidacao_calc = data_liquidacao || null;
    if (parseInt(condicaoId) === 3 && parseInt(meioId) !== 3) {
      data_liquidacao_calc = data_movimento || data_lancamento;
    }

    const movimento = await Movimentos.create({
      data_lancamento,
      data_movimento,
      clienteId,
      petId,
      servicoId,
      valor: valorServico,
      condicaoPagamentoId: condicaoId,
      meioPagamentoId: meioId,
      data_vencimento,
      data_liquidacao: data_liquidacao_calc,
      observacao: observacao || null,
      statusId,
      tabelaDePrecosId: tabelaDePrecosId || null
    });

    res.status(201).json(movimento);
  } catch (error) {
    console.error('Erro ao criar movimento:', error);
    res.status(500).json({ erro: 'Erro ao criar movimento.' });
  }
};

// PUT: Atualizar movimento existente
const atualizarMovimento = async (req, res) => {
  const { id } = req.params;
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
    statusId,
    tabelaDePrecosId
  } = req.body;

  try {
    const movimento = await Movimentos.findByPk(id);
    if (!movimento) {
      return res.status(404).json({ erro: 'Movimento não encontrado.' });
    }

    await movimento.update({
      data_lancamento,
      data_movimento,
      clienteId,
      petId,
      servicoId,
      valor: parseFloat(valor) || 0,
      condicaoPagamentoId,
      meioPagamentoId,
      data_vencimento,
      data_liquidacao: data_liquidacao || null,
      observacao: observacao || null,
      statusId,
      tabelaDePrecosId: tabelaDePrecosId || null
    });

    res.status(200).json(movimento);
  } catch (error) {
    console.error('Erro ao atualizar movimento:', error);
    res.status(500).json({ erro: 'Erro ao atualizar movimento.' });
  }
};

// DELETE: Soft delete
const deletarMovimento = async (req, res) => {
  const { id } = req.params;

  try {
    const movimento = await Movimentos.findByPk(id);
    if (!movimento) {
      return res.status(404).json({ erro: 'Movimento não encontrado.' });
    }

    await movimento.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar movimento:', error);
    res.status(500).json({ erro: 'Erro ao deletar movimento.' });
  }
};

module.exports = {
  listarMovimentos,
  criarMovimento,
  atualizarMovimento,
  deletarMovimento,
};
