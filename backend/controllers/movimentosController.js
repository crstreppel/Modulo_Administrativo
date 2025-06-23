const Movimentos = require('../models/Movimentos');
const Clientes = require('../models/Clientes');
const Pets = require('../models/Pets');
const Servicos = require('../models/Servicos');
const CondicaoPagamento = require('../models/CondicaoDePagamento');
const MeioPagamento = require('../models/MeioDePagamento');
const Status = require('../models/Status');

// GET: Listar todos os movimentos
const listarMovimentos = async (req, res) => {
  try {
    const movimentos = await Movimentos.findAll({
      include: [
        { model: Clientes, as: 'cliente' },
        { model: Pets, as: 'pet' },
        { model: Servicos, as: 'servico' },
        { model: CondicaoPagamento, as: 'condicaoPagamento' },
        { model: MeioPagamento, as: 'meioPagamento' },
        { model: Status, as: 'status' }
      ]
    });
    res.status(200).json(movimentos);
  } catch (error) {
    console.error('Erro ao listar movimentos:', error);
    res.status(500).json({ erro: 'Erro ao buscar movimentos.' });
  }
};

// POST: Criar um novo movimento
const criarMovimento = async (req, res) => {
  console.log('🧾 Dados recebidos no backend:', req.body);
  let {
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
    // Validações básicas
    if (!data_lancamento || !clienteId || !petId || !servicoId || !condicaoPagamentoId || !meioPagamentoId || !statusId) {
      return res.status(400).json({ erro: 'Campos obrigatórios ausentes.' });
    }

    // Calcula data de vencimento conforme a regra
    let data_vencimento;
    const condicaoId = parseInt(condicaoPagamentoId);

    if (condicaoId === 2) {
      // 10 do mês seguinte
      const lanc = new Date(data_lancamento);
      let ano = lanc.getFullYear();
      let mes = lanc.getMonth() + 1;

      if (mes === 12) {
        mes = 1;
        ano++;
      } else {
        mes++;
      }

      const mesStr = mes.toString().padStart(2, '0');
      data_vencimento = `${ano}-${mesStr}-10`;
    } else {
      data_vencimento = data_lancamento;
    }

    // Garante que valor é float
    const valorNumerico = parseFloat(valor) || 0;

    const novoMovimento = await Movimentos.create({
      data_lancamento,
      data_movimento,
      clienteId,
      petId,
      servicoId,
      valor: valorNumerico,
      condicaoPagamentoId,
      meioPagamentoId,
      data_vencimento,
      data_liquidacao: data_liquidacao || null,
      observacao: observacao || null,
      statusId,
      tabelaDePrecosId: tabelaDePrecosId || null
    });

    res.status(201).json(novoMovimento);
  } catch (error) {
    console.error('Erro ao criar movimento:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ erro: 'Erro de validação', detalhes: error.errors });
    }
    res.status(500).json({ erro: 'Erro ao criar movimento.' });
  }
};

// PUT: Atualizar um movimento existente
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
      valor,
      condicaoPagamentoId,
      meioPagamentoId,
      data_vencimento,
      data_liquidacao: data_liquidacao || null,
      observacao: observacao || null,
      statusId,
      tabelaDePrecosId
    });

    res.status(200).json(movimento);
  } catch (error) {
    console.error('Erro ao atualizar movimento:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ erro: 'Erro de validação', detalhes: error.errors });
    }
    res.status(500).json({ erro: 'Erro ao atualizar movimento.' });
  }
};

// DELETE: Soft delete de um movimento
const deletarMovimento = async (req, res) => {
  const { id } = req.params;

  try {
    const movimento = await Movimentos.findByPk(id);
    if (!movimento) {
      return res.status(404).json({ erro: 'Movimento não encontrado.' });
    }

    await movimento.destroy(); // Soft delete
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
