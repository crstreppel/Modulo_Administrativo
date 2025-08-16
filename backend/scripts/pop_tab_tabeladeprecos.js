const { sequelize } = require('../config/db');
const TabelaDePrecos = require('../models/TabelaDePrecos');
const Status = require('../models/Status');
const Servicos = require('../models/Servicos');
const Racas = require('../models/Racas');

async function popularTabelaDePrecos() {
  try {
    console.log('🔧 Iniciando população da Tabela de Preços (combinando todos os serviços com todas as raças)...');

    await sequelize.authenticate();
    await TabelaDePrecos.sync({ alter: true });

    const statusAtivo = await Status.findByPk(1);
    if (!statusAtivo) throw new Error('❌ Status ATIVO (ID 1) não encontrado. Execute pop_tab_status.js primeiro!');

    const servicos = await Servicos.findAll({ where: { statusId: statusAtivo.id } });
    const racas = await Racas.findAll({ where: { statusId: statusAtivo.id } });

    if (!servicos.length || !racas.length) throw new Error('❌ Nenhum serviço ou raça encontrada com status ATIVO.');

    const condicaoPadraoId = 1;
    const meioPadraoId = 1;

    const precos = [];

    servicos.forEach((servico, idxServico) => {
      racas.forEach((raca, idxRaca) => {
        const precoBase = 50; // valor base
        const preco = precoBase + (idxServico * 10) + (idxRaca * 2); // só pra variar

        precos.push({
          servicoId: servico.id,
          condicaoDePagamentoId: condicaoPadraoId,
          racaId: raca.id,
          petId: null,
          valorServico: preco.toFixed(2),
          statusId: statusAtivo.id
        });
      });
    });

    const result = await TabelaDePrecos.bulkCreate(precos, {
      updateOnDuplicate: [
        'valorServico',
        'servicoId',
        'condicaoDePagamentoId',
        'racaId',
        'petId',
        'statusId'
      ],
      validate: true
    });

    console.log(`✅ ${result.length} registros inseridos/atualizados na Tabela de Preços.`);
    return true;

  } catch (error) {
    console.error('💥 Erro ao popular Tabela de Preços:', error.message);
    throw error;
  }
}

module.exports = popularTabelaDePrecos;
