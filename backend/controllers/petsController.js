const Pets = require('../models/Pets');
const Clientes = require('../models/Clientes');
const Racas = require('../models/Racas');
const Status = require('../models/Status');


// GET: Listar pets (com filtro opcional clienteId)
const listarPets = async (req, res) => {
  const { clienteId } = req.query;
  const where = {};
  if (clienteId) where.clienteId = clienteId;

  try {
    const pets = await Pets.findAll({
      where,
      include: [
        { model: Clientes, as: 'cliente' },
        { model: Racas, as: 'raca', include: ['especie'] }, // já puxa a espécie da raça
        { model: Status, as: 'status' }
      ]
    });
    res.status(200).json(pets);
  } catch (error) {
    console.error('Erro ao listar pets:', error);
    res.status(500).json({ erro: 'Erro ao buscar pets.' });
  }
};

// POST: Criar pet com validação raça→espécie
const criarPet = async (req, res) => {
  const { nome, clienteId, racaId, statusId, foto } = req.body;

  if (!nome || !clienteId || !racaId || !statusId) {
    return res.status(400).json({ erro: 'Campos obrigatórios: nome, clienteId, racaId, statusId' });
  }

  try {
    const cliente = await Clientes.findByPk(clienteId);
    if (!cliente) return res.status(400).json({ erro: 'Cliente não encontrado' });

    const raca = await Racas.findByPk(racaId, { include: ['especie'] });
    if (!raca) return res.status(400).json({ erro: 'Raça não encontrada' });

    const status = await Status.findByPk(statusId);
    if (!status) return res.status(400).json({ erro: 'Status não encontrado' });

    // Aqui a validação raça ↔ espécie rola, se quiser validar espécie informada, mas vamos seguir só pela raça
    // Se precisar validar espécie, é só comparar com raca.especieId

    const novoPet = await Pets.create({
      nome,
      clienteId,
      racaId,
      statusId,
      foto,
    });

    res.status(201).json(novoPet);
  } catch (error) {
    console.error('Erro ao criar pet:', error);
    res.status(500).json({ erro: 'Erro ao criar pet.' });
  }
};

// PUT: Atualizar pet com validações
const atualizarPet = async (req, res) => {
  const { id } = req.params;
  const { nome, clienteId, racaId, statusId, foto } = req.body;

  if (!nome || !clienteId || !racaId || !statusId) {
    return res.status(400).json({ erro: 'Campos obrigatórios: nome, clienteId, racaId, statusId' });
  }

  try {
    const pet = await Pets.findByPk(id);
    if (!pet) return res.status(404).json({ erro: 'Pet não encontrado.' });

    const cliente = await Clientes.findByPk(clienteId);
    if (!cliente) return res.status(400).json({ erro: 'Cliente não encontrado' });

    const raca = await Racas.findByPk(racaId, { include: ['especie'] });
    if (!raca) return res.status(400).json({ erro: 'Raça não encontrada' });

    const status = await Status.findByPk(statusId);
    if (!status) return res.status(400).json({ erro: 'Status não encontrado' });

    await pet.update({
      nome,
      clienteId,
      racaId,
      statusId,
      foto,
    });

    res.status(200).json(pet);
  } catch (error) {
    console.error('Erro ao atualizar pet:', error);
    res.status(500).json({ erro: 'Erro ao atualizar pet.' });
  }
};

// DELETE: Soft delete
const deletarPet = async (req, res) => {
  const { id } = req.params;

  try {
    const pet = await Pets.findByPk(id);
    if (!pet) return res.status(404).json({ erro: 'Pet não encontrado.' });

    await pet.destroy(); // soft delete via paranoid
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar pet:', error);
    res.status(500).json({ erro: 'Erro ao deletar pet.' });
  }
};

module.exports = {
  listarPets,
  criarPet,
  atualizarPet,
  deletarPet,
};
