const TabelaDePrecos = require('../models/TabelaDePrecos');
const Servicos = require('../models/Servicos');
const CondicaoDePagamento = require('../models/CondicaoDePagamento');
const Meio_de_pagamento = require('../models/MeioDePagamento');
const Racas = require('../models/Racas');
const Pets = require('../models/Pets');
const Status = require('../models/Status');

// GET: Listar todos os registros de preços
const listarTabelaDePrecos = async (req, res) => {
  try {
    const tabelaDePrecos = await TabelaDePrecos.findAll({
      include: [
        { model: Servicos, as: 'servico' },
        { model: CondicaoDePagamento, as: 'condicaoDePagamento' },
        { model: Meio_de_pagamento, as: 'meioDePagamento' },
        { model: Racas, as: 'raca' },
        { model: Pets, as: 'pet' },
        { model: Status, as: 'status' }
      ]
    });
    res.status(200).json(tabelaDePrecos);
  } catch (error) {
    console.error('Erro ao listar tabela de preços:', error);
    res.status(500).json({ erro: 'Erro ao buscar tabela de preços.' });
  }
};

// GET: Buscar tabela de preços por petId ou racaId (regra de negócio)
const buscarTabelaPorPetOuRaca = async (req, res) => {
  const { petId } = req.query;

  try {
    const pet = await Pets.findByPk(petId);

    if (!pet) {
      return res.status(404).json({ erro: 'Pet não encontrado.' });
    }

    // Primeiro, tenta encontrar tabelas ligadas diretamente ao pet
    const tabelasPorPet = await TabelaDePrecos.findAll({
      where: { petId },
      include: [
        { model: Servicos, as: 'servico' },
        { model: CondicaoDePagamento, as: 'condicaoDePagamento' },
        { model: Meio_de_pagamento, as: 'meioDePagamento' },
        { model: Pets, as: 'pet' },
        { model: Status, as: 'status' }
      ]
    });

    if (tabelasPorPet.length > 0) {
      return res.status(200).json(tabelasPorPet);
    }

    // Se não encontrou por petId, busca por racaId do pet
    const tabelasPorRaca = await TabelaDePrecos.findAll({
      where: { racaId: pet.racaId },
      include: [
        { model: Servicos, as: 'servico' },
        { model: CondicaoDePagamento, as: 'condicaoDePagamento' },
        { model: Meio_de_pagamento, as: 'meioDePagamento' },
        { model: Racas, as: 'raca' },
        { model: Status, as: 'status' }
      ]
    });

    return res.status(200).json(tabelasPorRaca);

  } catch (error) {
    console.error('Erro ao buscar tabela de preços por pet/raca:', error);
    res.status(500).json({ erro: 'Erro ao buscar tabela de preços.' });
  }
};

// POST: Criar um novo registro de preço
const criarTabelaDePrecos = async (req, res) => {
  const { servicoId, condicaoDePagamentoId, meioDePagamentoId, racaId, petId, valorServico, statusId } = req.body;

  try {
    if ((petId && racaId) || (!petId && !racaId)) {
      return res.status(400).json({ erro: 'Informe apenas petId ou racaId, mas não ambos.' });
    }

    const novoRegistro = await TabelaDePrecos.create({
      servicoId,
      condicaoDePagamentoId,
      meioDePagamentoId,
      racaId: petId ? null : racaId,
      petId: racaId ? null : petId,
      valorServico,
      statusId
    });

    const tabelaDePrecosCompleta = await TabelaDePrecos.findByPk(novoRegistro.id, {
      include: [
        { model: Servicos, as: 'servico' },
        { model: CondicaoDePagamento, as: 'condicaoDePagamento' },
        { model: Meio_de_pagamento, as: 'meioDePagamento' },
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

// PUT: Atualizar um registro existente
const atualizarTabelaDePrecos = async (req, res) => {
  const { id } = req.params;
  const { servicoId, condicaoDePagamentoId, meioDePagamentoId, racaId, petId, valorServico, statusId } = req.body;

  try {
    const tabelaDePreco = await TabelaDePrecos.findByPk(id);

    if (!tabelaDePreco) {
      return res.status(404).json({ erro: 'Registro não encontrado.' });
    }

    if ((petId && racaId) || (!petId && !racaId)) {
      return res.status(400).json({ erro: 'Informe apenas petId ou racaId, mas não ambos.' });
    }

    await tabelaDePreco.update({ 
      servicoId, 
      condicaoDePagamentoId, 
      meioDePagamentoId, 
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

// DELETE: Excluir (soft delete) um registro
const deletarTabelaDePrecos = async (req, res) => {
  const { id } = req.params;

  try {
    const tabelaDePreco = await TabelaDePrecos.findByPk(id);

    if (!tabelaDePreco) {
      return res.status(404).json({ erro: 'Registro não encontrado.' });
    }

    await tabelaDePreco.destroy(); // Soft delete ativado
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar registro:', error);
    res.status(500).json({ erro: 'Erro ao deletar registro.' });
  }
};

module.exports = {
  listarTabelaDePrecos,
  buscarTabelaPorPetOuRaca, // <- NOVO
  criarTabelaDePrecos,
  atualizarTabelaDePrecos,
  deletarTabelaDePrecos,
};
