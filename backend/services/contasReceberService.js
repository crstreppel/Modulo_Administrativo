/* ------------------------------------------------------------------
 * Serviço: contasReceberService.js  •  v1.0 - Padrão Bruxão
 * Responsável por gerenciar regras de negócio de CONTAS A RECEBER.
 * Inclui cancelamento de títulos e logs de auditoria.
 * ------------------------------------------------------------------ */

const { sequelize } = require('../config/db');
const { DataTypes, Op } = require('sequelize');
const ContasAReceber = require('../models/ContasAReceber');
const Status = require('../models/Status');

/**
 * Cancela todos os títulos associados a um movimento
 * - Marca deletedAt e statusId = CANCELADO
 * - Adiciona motivo e loga ação
 */
async function cancelarTitulosPorMovimento(movimentoId, motivo = 'Cancelamento de movimento') {
  const transaction = await sequelize.transaction();
  try {
    console.log(`⚙️  Cancelando títulos do movimento ${movimentoId}...`);

    // Busca títulos ativos vinculados ao movimento
    const titulos = await ContasAReceber.findAll({
      where: {
        movimentoId,
        deletedAt: { [Op.is]: null },
      },
      transaction,
    });

    if (!titulos || titulos.length === 0) {
      console.log('ℹ️  Nenhum título ativo encontrado para esse movimento.');
      await transaction.commit();
      return { sucesso: true, mensagem: 'Nenhum título para cancelar.' };
    }

    // Atualiza cada título
    for (const titulo of titulos) {
      titulo.statusId = 7; // CANCELADO
      titulo.deletedAt = new Date();
      titulo.observacao = `${titulo.observacao || ''} | Cancelado em ${new Date().toLocaleString()} - Motivo: ${motivo}`;
      await titulo.save({ transaction });
      console.log(`🧾 Título ${titulo.id} cancelado.`);
    }

    await transaction.commit();
    console.log(`✅ ${titulos.length} título(s) cancelado(s) com sucesso.`);
    return { sucesso: true, titulosCancelados: titulos.length };
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Erro em cancelarTitulosPorMovimento:', error);
    throw error;
  }
}

/**
 * Cancela título individual (uso manual ou auditoria)
 */
async function cancelarTituloIndividual(tituloId, motivo = 'Cancelamento manual') {
  const transaction = await sequelize.transaction();
  try {
    const titulo = await ContasAReceber.findByPk(tituloId, { transaction });
    if (!titulo) throw new Error(`Título ${tituloId} não encontrado.`);

    titulo.statusId = 7; // CANCELADO
    titulo.deletedAt = new Date();
    titulo.observacao = `${titulo.observacao || ''} | Cancelado em ${new Date().toLocaleString()} - Motivo: ${motivo}`;
    await titulo.save({ transaction });

    await transaction.commit();
    console.log(`🧾 Título ${tituloId} cancelado com sucesso.`);
    return { sucesso: true };
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Erro em cancelarTituloIndividual:', error);
    throw error;
  }
}

/**
 * (Uso futuro) Gera novo título — renegociação, parcelamento, etc.
 */
async function gerarNovoTitulo(dadosTitulo) {
  const transaction = await sequelize.transaction();
  try {
    const novoTitulo = await ContasAReceber.create(dadosTitulo, { transaction });
    await transaction.commit();
    console.log(`💰 Novo título gerado (ID ${novoTitulo.id}).`);
    return { sucesso: true, tituloId: novoTitulo.id };
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Erro em gerarNovoTitulo:', error);
    throw error;
  }
}

module.exports = {
  cancelarTitulosPorMovimento,
  cancelarTituloIndividual,
  gerarNovoTitulo,
};
