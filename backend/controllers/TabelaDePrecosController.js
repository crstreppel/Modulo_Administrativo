const TabelaDePrecos = require('../models/TabelaDePrecos');
const Servicos = require('../models/Servicos');
const CondicaoDePagamento = require('../models/CondicaoDePagamento');
// REMOVIDO: const Meio_de_pagamento = require('../models/MeioDePagamento');
const Racas = require('../models/Racas');
const Pets = require('../models/Pets');
const Status = require('../models/Status');
const { Op } = require('sequelize');

/**
 * Helper: valida se a raca informada pertence à especie informada.
 * - Se não houver especieId OU não houver racaId, não valida (fica neutro).
 * - Se houver ambos, checa no banco.
 */
async function validarEspecieDaRaca(especieId, racaId) {
  if (!especieId || !racaId) return true;
  const raca = await Racas.findByPk(racaId, { attributes: ['id', 'especieId'] });
  if (!raca) return false;
  return Number(raca.especieId) === Number(especieId);
}

// GET: Listar todos os registros ou filtrar por petId, racaId, servicoId (+ especieId para raca)
const listarTabelaDePrecos = async (req, res) => {
  try {
    const { petId, racaId, servicoId, especieId } = req.query;
    const where = { deletedAt: null };

    if (petId) where.petId = petId;
    if (racaId) where.racaId = racaId;
    if (servicoId) where.servicoId = servicoId;

    // Regra de filtro por espécie:
    // - Se especieId vier, mantemos genéricos (racaId null) e registros cuja RAÇA pertence à espécie.
    // - Não mexe em petId (evita depender de include encadeado e não quebrar relações existentes).
    if (especieId) {
      where[Op.or] = [
        { racaId: null },
        { '$raca.especieId$': Number(especieId) }
      ];
    }

    const tabelaDePrecos = await TabelaDePrecos.findAll({
      where,
      include: [
        { model: Servicos, as: 'servico' },
        { model: CondicaoDePagamento, as: 'condicaoDePagamento' },
        // REMOVIDO: { model: Meio_de_pagamento, as: 'meioDePagamento' },
        {
          model: Racas,
          as: 'raca',
          // Mantém LEFT JOIN; o filtro principal acima usa $raca.especieId$ no where.
          required: false,
          attributes: ['id', 'descricao', 'especieId']
        },
        { model: Pets, as: 'pet' },
        { model: Status, as: 'status' }
      ],
      order: [['id', 'ASC']]
    });

    res.status(200).json(tabelaDePrecos);
  } catch (error) {
    console.error('Erro ao listar tabela de preços:', error);
    res.status(500).json({ erro: 'Erro ao buscar tabela de preços.' });
  }
};

// GET: Buscar tabela por petId e servicoId com fallback para racaId e genérico (sem mudança)
const buscarTabelaPorPetOuRaca = async (req, res) => {
  const petId = req.query.petId;
  const servicoId = req.query.servicoId;

  if (!servicoId) return res.status(400).json({ erro: 'Parâmetro servicoId é obrigatório.' });

  try {
    let racaId = null;

    if (petId) {
      const pet = await Pets.findByPk(petId, { attributes: ['id', 'racaId'] });
      if (!pet) return res.status(404).json({ erro: 'Pet não encontrado.' });
      racaId = pet.racaId || null;
    }

    // where base por serviço + não-deletado
    const whereBase = { servicoId, deletedAt: null };

    // Monta o alvo:
    // - Se tem PET e RAÇA: PET OU RAÇA OU genérico
    // - Se tem só PET: PET OU genérico
    // - Se não tem PET: apenas genérico
    let whereAlvo;
    if (petId && racaId) {
      whereAlvo = {
        [Op.or]: [
          { petId },
          { racaId },
          { [Op.and]: [{ petId: null }, { racaId: null }] }
        ]
      };
    } else if (petId && !racaId) {
      whereAlvo = {
        [Op.or]: [
          { petId },
          { [Op.and]: [{ petId: null }, { racaId: null }] }
        ]
      };
    } else {
      whereAlvo = { [Op.and]: [{ petId: null }, { racaId: null }] };
    }

    const registros = await TabelaDePrecos.findAll({
      where: { ...whereBase, ...whereAlvo },
      include: [
        { model: Servicos, as: 'servico' },
        { model: CondicaoDePagamento, as: 'condicaoDePagamento' },
        // REMOVIDO: { model: Meio_de_pagamento, as: 'meioDePagamento' },
        { model: Racas, as: 'raca' },
        { model: Pets, as: 'pet' },
        { model: Status, as: 'status' }
      ]
    });

    // Ordena por especificidade: PET > RAÇA > GENÉRICO, depois por id
    registros.sort((a, b) => {
      const aScore = a.petId ? 0 : a.racaId ? 1 : 2;
      const bScore = b.petId ? 0 : b.racaId ? 1 : 2;
      if (aScore !== bScore) return aScore - bScore;
      return a.id - b.id;
    });

    return res.status(200).json(registros);
  } catch (error) {
    console.error('Erro ao buscar tabela de preços por pet/raça:', error);
    res.status(500).json({ erro: 'Erro ao buscar tabela de preços.' });
  }
};

// Alias (rotas antigas que apontam para "buscarPorPetOuRaca")
const buscarPorPetOuRaca = (req, res) => buscarTabelaPorPetOuRaca(req, res);

// NOVO (sem meioPagamento): Verificar se já existe entrada para pet OU raça com condicaoDePagamento + servico
const verificarEntrada = async (req, res) => {
  const { petId, condicaoDePagamentoId, servicoId } = req.query;

  if (!petId || !condicaoDePagamentoId || !servicoId) {
    return res.status(400).json({
      erro: 'Parâmetros petId, condicaoDePagamentoId e servicoId são obrigatórios.'
    });
  }

  try {
    const pet = await Pets.findByPk(petId, { attributes: ['id', 'racaId'] });
    if (!pet) return res.status(404).json({ erro: 'Pet não encontrado.' });

    const entrada = await TabelaDePrecos.findOne({
      where: {
        deletedAt: null,
        condicaoDePagamentoId,
        servicoId,
        [Op.or]: [
          { petId },
          { racaId: pet.racaId }
        ]
      }
    });

    if (entrada) return res.json({ existe: true });
    return res.json({ existe: false, racaId: pet.racaId });
  } catch (error) {
    console.error('Erro ao verificar entrada:', error);
    res.status(500).json({ erro: 'Erro ao verificar entrada na tabela de preços.' });
  }
};

// POST: Criar um novo registro (sem meioPagamento) + validação de especie/raca
const criarTabelaDePrecos = async (req, res) => {
  const { servicoId, condicaoDePagamentoId, racaId, petId, valorServico, statusId, especieId } = req.body;

  try {
    if ((petId && racaId) || (!petId && !racaId)) {
      return res.status(400).json({ erro: 'Informe apenas petId ou racaId, mas não ambos.' });
    }

    // Se veio especieId e racaId, valida coerência
    const ok = await validarEspecieDaRaca(especieId, racaId);
    if (!ok) {
      return res.status(400).json({ erro: 'A raça informada não pertence à espécie selecionada.' });
    }

    const novoRegistro = await TabelaDePrecos.create({
      servicoId,
      condicaoDePagamentoId,
      racaId: petId ? null : racaId,
      petId: racaId ? null : petId,
      valorServico,
      statusId: statusId || 1
    });

    const tabelaDePrecosCompleta = await TabelaDePrecos.findByPk(novoRegistro.id, {
      include: [
        { model: Servicos, as: 'servico' },
        { model: CondicaoDePagamento, as: 'condicaoDePagamento' },
        // REMOVIDO: { model: Meio_de_pagamento, as: 'meioDePagamento' },
        { model: Racas, as: 'raca' },
        { model: Pets, as: 'pet' },
        { model: Status, as: 'status' }
      ]
    });

    res.status(201).json(tabelaDePrecosCompleta);
  } catch (error) {
    console.error('Erro ao criar registro na tabela de preços:', error);
    res.status(500).json({ erro: 'Erro ao criar registro.' });
  }
};

// PUT: Atualizar um registro existente (sem meioPagamento) + validação de especie/raca
const atualizarTabelaDePrecos = async (req, res) => {
  const { id } = req.params;
  const { servicoId, condicaoDePagamentoId, racaId, petId, valorServico, statusId, especieId } = req.body;

  try {
    const tabelaDePreco = await TabelaDePrecos.findByPk(id);
    if (!tabelaDePreco) return res.status(404).json({ erro: 'Registro não encontrado.' });

    if ((petId && racaId) || (!petId && !racaId)) {
      return res.status(400).json({ erro: 'Informe apenas petId ou racaId, mas não ambos.' });
    }

    // Se veio especieId e racaId, valida coerência
    const ok = await validarEspecieDaRaca(especieId, racaId);
    if (!ok) {
      return res.status(400).json({ erro: 'A raça informada não pertence à espécie selecionada.' });
    }

    await tabelaDePreco.update({
      servicoId,
      condicaoDePagamentoId,
      racaId: petId ? null : racaId,
      petId: racaId ? null : petId,
      valorServico,
      statusId
    });

    res.status(200).json(tabelaDePreco);
  } catch (error) {
    console.error('Erro ao atualizar tabela de preços:', error);
    res.status(500).json({ erro: 'Erro ao atualizar registro.' });
  }
};

// DELETE: Soft delete
const deletarTabelaDePrecos = async (req, res) => {
  const { id } = req.params;

  try {
    const tabelaDePreco = await TabelaDePrecos.findByPk(id);
    if (!tabelaDePreco) return res.status(404).json({ erro: 'Registro não encontrado.' });

    await tabelaDePreco.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar registro:', error);
    res.status(500).json({ erro: 'Erro ao deletar registro.' });
  }
};

module.exports = {
  listarTabelaDePrecos,
  buscarTabelaPorPetOuRaca,
  buscarPorPetOuRaca, // alias para rotas antigas
  criarTabelaDePrecos,
  atualizarTabelaDePrecos,
  deletarTabelaDePrecos,
  verificarEntrada
};
