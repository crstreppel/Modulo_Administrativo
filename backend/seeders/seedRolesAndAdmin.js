// v1.3 - Padrão Bruxão V1 • Seed Roles + Usuário Admin
// Executa com: `node seeders/seedRolesAndAdmin.js`
// Cria roles básicas e um usuário admin inicial

const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db');
const { DataTypes } = require('sequelize');

const Role = require('../models/Role')(sequelize, DataTypes);
const Usuario = require('../models/Usuario')(sequelize, DataTypes);

async function run() {
  try {
    console.log('🔌 Conectando ao banco...');
    await sequelize.authenticate();
    console.log('✅ Conectado.');

    // === Cria roles básicas ===
    const rolesData = [
      { nome: 'admin', descricao: 'Administrador do sistema' },
      { nome: 'financeiro', descricao: 'Controle financeiro' },
      { nome: 'operador', descricao: 'Usuário operador padrão' },
    ];

    for (const role of rolesData) {
      const [r, created] = await Role.findOrCreate({
        where: { nome: role.nome },
        defaults: role,
      });
      console.log(created ? `➕ Role criada: ${role.nome}` : `✔️ Role já existe: ${role.nome}`);
    }

    // === Garante usuário admin ===
    const adminEmail = 'admin@petropolitan.pet';
    const senhaPadrao = 'admin123'; // 🚨 Alterar depois em produção
    const senhaHash = await bcrypt.hash(senhaPadrao, 12);
    const roleAdmin = await Role.findOne({ where: { nome: 'admin' } });

    const [user, createdUser] = await Usuario.findOrCreate({
      where: { email: adminEmail },
      defaults: {
        nome: 'Administrador',
        email: adminEmail,
        senhaHash,
        statusId: 1, // precisa existir um Status "ativo" com id=1
        roleId: roleAdmin.id,
        precisaTrocarSenha: true,
      },
    });

    console.log(
      createdUser
        ? `👑 Usuário admin criado (${adminEmail} / ${senhaPadrao})`
        : `✔️ Usuário admin já existe (${adminEmail})`
    );

    console.log('🏁 Seed de roles e admin concluído com sucesso!');
  } catch (err) {
    console.error('❌ Erro no seed:', err);
    throw err;
  } finally {
    await sequelize.close();
  }
}

// Só executa se rodar via terminal
if (require.main === module) {
  run().catch(() => process.exit(1));
}

module.exports = { run };