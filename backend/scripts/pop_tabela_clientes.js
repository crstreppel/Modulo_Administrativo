// scripts/pop_tabela_clientes.js

const { sequelize } = require('../config/db');
const Clientes = require('../models/Clientes');
const Status = require('../models/Status');

async function popularClientes() {
  try {
    console.log('🔄 Iniciando população da tabela Clientes...');

    // 1. Verifica conexão e sincroniza a tabela Clientes
    await sequelize.authenticate();
    await Clientes.sync({ alter: true });

    // 2. Busca o status ATIVO (ID 1)
    const statusAtivo = await Status.findByPk(1);
    if (!statusAtivo) {
      throw new Error('❌ Status ATIVO (ID 1) não encontrado. Execute primeiro o script que popula a tabela Status.');
    }

    // 3. Lista de clientes a serem inseridos
    
      // parte do código...
const clientes = [
  {
    nome: 'Ana Silva',
    telefone: '11999999999',
    endereco: 'Rua das Flores',
    numero: '123',
    bairro: 'Jardim Primavera',
    cpf: '12345678900',
    statusId: statusAtivo.id
  },
  {
    nome: 'Carlos Souza',
    telefone: '11888888888',
    endereco: 'Avenida Central',
    numero: '456',
    bairro: 'Centro',
    cpf: '98765432100',
    statusId: statusAtivo.id
  },
  {
    nome: 'Juliana Costa',
    telefone: '11777777777',
    endereco: 'Rua do Sol',
    numero: '789',
    bairro: 'Vila Nova',
    cpf: '11223344556',
    statusId: statusAtivo.id
  }
];

    

    // 4. Inserção com updateOnDuplicate
    const result = await Clientes.bulkCreate(clientes, {
      updateOnDuplicate: ['nome', 'telefone', 'endereco', 'numero', 'bairro', 'cpf', 'statusId'],
      validate: true
    });

    console.log(`📊 ${result.length} clientes inseridos/atualizados com sucesso.`);
    return true;

  } catch (error) {
    console.error('❌ Erro ao popular clientes:', error.message);
    throw error;
  }
}

module.exports = popularClientes;
