const { faker } = require('@faker-js/faker/locale/pt_BR');
const { sequelize } = require('../config/db');
const Clientes = require('../models/Clientes');
const Status = require('../models/Status');

async function popularClientes() {
  try {
    console.log('👤 Populando 1000 clientes com dados completos...');

    await sequelize.authenticate();
    await Clientes.sync({ alter: true });

    const statusAtivo = await Status.findByPk(1);
    if (!statusAtivo) throw new Error('❌ Status ATIVO (ID 1) não encontrado. Execute pop_tab_status.js antes.');

    const clientes = [];

    for (let i = 1; i <= 1000; i++) {
      clientes.push({
        id: i,
        nome: faker.person.fullName(),
        telefone: faker.phone.number('(##) #####-####'),
        endereco: faker.location.street(),
        numero: faker.location.buildingNumber(),
        bairro: faker.location.city(),
        cidade: faker.location.city(),
        estado: faker.location.state(),
        pais: 'Brasil',
        cpf: faker.number.int({ min: 10000000000, max: 99999999999 }).toString(),
        redesSociais: [faker.internet.url()],
        aceitaLembreteBanho: faker.datatype.boolean(),
        statusId: statusAtivo.id
      });
    }

    const result = await Clientes.bulkCreate(clientes, {
      updateOnDuplicate: [
        'nome', 'telefone', 'endereco', 'numero', 'bairro',
        'cidade', 'estado', 'pais', 'cpf', 'redesSociais',
        'aceitaLembreteBanho', 'statusId'
      ],
      validate: true
    });

    console.log(`✅ ${result.length} clientes inseridos com sucesso.`);
    return true;

  } catch (err) {
    console.error('💥 Erro ao popular clientes:', err.message);
    throw err;
  }
}

module.exports = popularClientes;
