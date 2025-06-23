const { sequelize } = require('../config/db');
const Status = require('../models/Status');

async function popularStatus() {
  try {
    // 1. Autentica e sincroniza apenas o model Status
    await sequelize.authenticate();
    console.log('✅ Conexão com o banco estabelecida.');

    // Usa alter: true para ajustar a tabela sem dropar dados
    await Status.sync({ alter: true }); 

    // 2. Dados iniciais (compatíveis com seu model)
    const statuses = [
      { id: 1, descricao: 'ATIVO' },
      { id: 2, descricao: 'ABERTO' },
      { id: 3, descricao: 'ABERTO PARCIAL' },
      { id: 4, descricao: 'INATIVO' },
      { id: 5, descricao: 'LIQUIDADO' },
      { id: 6, descricao: 'FALECIDO' }
    ];

    // 3. Upsert (insere ou atualiza se o ID já existir)
    for (const status of statuses) {
      await Status.findOrCreate({
        where: { id: status.id }, // Busca pelo ID para evitar duplicatas
        defaults: status
      });
      console.log(`✔ Status "${status.descricao}" (ID: ${status.id}) processado.`);
    }

    console.log('🎉 Tabela Status populada com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  }
}

module.exports = popularStatus;