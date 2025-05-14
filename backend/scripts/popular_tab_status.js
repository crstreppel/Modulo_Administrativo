// backend/scripts/popular_tab_status.js

const sequelize = require('../config/db');
const Status = require('../models/Status');

async function popularStatus() {
  try {
    await sequelize.sync(); // sincroniza modelos com o banco

    const dadosIniciais = ['ATIVO', 'INATIVO', 'ABERTO', 'LIQUIDADO'];

    for (const descricao of dadosIniciais) {
      const [registro, criado] = await Status.findOrCreate({
        where: { descricao }
      });

      if (criado) {
        console.log(`Status "${descricao}" inserido.`);
      } else {
        console.log(`Status "${descricao}" já existe.`);
      }
    }

    console.log('Tabela status populada com sucesso!');
  } catch (error) {
    console.error('Erro ao popular tabela status:', error);
  } finally {
    // ⚠️ Só feche a conexão se tiver certeza de que não será usada depois
    await sequelize.close(); // ok neste caso por ser um script isolado
  }
}

popularStatus();
