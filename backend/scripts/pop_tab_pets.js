const { faker } = require('@faker-js/faker/locale/pt_BR');
const { sequelize } = require('../config/db');
const Pets = require('../models/Pets');
const Clientes = require('../models/Clientes');
const Racas = require('../models/Racas');
const Status = require('../models/Status');

async function popularPets() {
  try {
    console.log('🐾 Populando 3000 pets...');

    await sequelize.authenticate();
    await Pets.sync({ alter: true });

    const statusAtivo = await Status.findByPk(1);
    if (!statusAtivo) throw new Error('❌ Status ATIVO (ID 1) não encontrado. Execute pop_tab_status.js antes.');

    const clientes = await Clientes.findAll({ attributes: ['id'] });
    const racas = await Racas.findAll({ attributes: ['id', 'especieId'] });

    if (!clientes.length || !racas.length) throw new Error('❌ Clientes ou raças não encontrados.');

    const pets = [];

    for (let i = 1; i <= 3000; i++) {
      const cliente = faker.helpers.arrayElement(clientes);
      const raca = faker.helpers.arrayElement(racas);

      pets.push({
        id: i,
        nome: faker.animal.dog(),
        clienteId: cliente.id,
        especieId: raca.especieId,
        racaId: raca.id,
        foto: null,
        statusId: statusAtivo.id
      });
    }

    const result = await Pets.bulkCreate(pets, {
      updateOnDuplicate: [
        'nome', 'clienteId', 'especieId', 'racaId', 'foto', 'statusId'
      ],
      validate: true
    });

    console.log(`✅ ${result.length} pets inseridos com sucesso.`);
    return true;

  } catch (err) {
    console.error('💥 Erro ao popular pets:', err.message);
    throw err;
  }
}

module.exports = popularPets;
