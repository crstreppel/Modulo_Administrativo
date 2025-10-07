/* ------------------------------------------------------------------
 * Serviço: adiantamentosService.js  •  v1.0 - Padrão Bruxão
 * Responsável por gerenciar regras de negócio ligadas a ADIANTAMENTOS.
 * Inclui estornos, recomposições de saldo e lançamentos de ajustes.
 * ----------------------------------------------------------------*/

const { sequelize } = require('../config/db');
const { DataTypes, Op } = require('sequelize');
const Movimentos = require('../models/Movimentos');
const Adiantamento = require('../models/Adiantamento');
const Status = require('../models/Status');

/**
 * Cria movimento de ajuste genérico (interno)
 */
async function criarMovimentoAjuste(movimentoOriginal, valorAjuste, observacao, transaction) {
  const novoMov = await Movimentos.create({
    data_lancamento: new Date(),
    data_movimento: new Date(),
    clienteId: movimentoOriginal.clienteId,
    petId: movimentoOriginal.petId,
    servicoId: movimentoOriginal.servicoId,
    tabelaDePrecosId: movimentoOriginal.tabelaDePrecosId || null,
    valor: valorAjuste,
    condicaoPagamentoId: 3, // ADIANTAMENTO
    meioPagamentoId: 3,     // ADIANTAMENTO
    data_liquidacao: new Date(),
    observacao,
    statusId: 8, // AJUSTE
    adiantamentoId: movimentoOriginal.adiantamentoId || null,
    valorAbatidoAdiantamento: 0,
  }, { transaction });

  console.log(`🧾 Movimento de ajuste criado (ID ${novoMov.id}) - valor ${valorAjuste}`);
  return novoMov;
}

/**
 * Estorna crédito de um adiantamento cancelado
 * - Cria movimento de ajuste (valor negativo)
 * - Atualiza saldo do adiantamento
 */
async function estornarCredito(movimento, motivo = 'Estorno automático por cancelamento') {
  const transaction = await sequelize.transaction();
  try {
    console.log(`⚙️  Estornando crédito do adiantamento originado pelo movimento ${movimento.id}...`);

    const adiantamento = await Adiantamento.findOne({
      where: { clienteId: movimento.clienteId },
      order: [['createdAt', 'DESC']],
      transaction,
    });

    if (!adiantamento) {
      console.warn('⚠️  Nenhum adiantamento encontrado para o cliente.');
      await transaction.commit();
      return { sucesso: false, mensagem: 'Nenhum adiantamento encontrado.' };
    }

    const valorAjuste = -Math.abs(Number(movimento.valor));
    const obs = `${motivo} | Movimento origem: ${movimento.id}`;

    // Cria movimento de ajuste
    const novoMov = await criarMovimentoAjuste(movimento, valorAjuste, obs, transaction);

    // Atualiza saldo do adiantamento
    adiantamento.saldoAtual = Number(adiantamento.saldoAtual) + valorAjuste;
    await adiantamento.save({ transaction });

    await transaction.commit();
    console.log(`✅ Estorno concluído. Saldo atualizado: ${adiantamento.saldoAtual}`);
    return { sucesso: true, ajuste: novoMov, novoSaldo: adiantamento.saldoAtual };
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Erro em estornarCredito:', error);
    throw error;
  }
}

/**
 * Recompõe saldo de um adiantamento usado em movimento cancelado
 * - Cria movimento de ajuste (valor positivo)
 * - Atualiza saldo do adiantamento
 */
async function recomporSaldo(movimento, motivo = 'Recomposição de saldo após cancelamento') {
  const transaction = await sequelize.transaction();
  try {
    console.log(`⚙️  Repondo saldo do adiantamento (movimento ${movimento.id})...`);

    if (!movimento.adiantamentoId) {
      console.warn('⚠️  Movimento sem referência de adiantamento.');
      await transaction.commit();
      return { sucesso: false, mensagem: 'Movimento sem referência de adiantamento.' };
    }

    const adiantamento = await Adiantamento.findByPk(movimento.adiantamentoId, { transaction });
    if (!adiantamento) {
      console.warn('⚠️  Adiantamento não encontrado.');
      await transaction.commit();
      return { sucesso: false, mensagem: 'Adiantamento não encontrado.' };
    }

    const valorAjuste = Math.abs(Number(movimento.valorAbatidoAdiantamento || movimento.valor));
    const obs = `${motivo} | Movimento origem: ${movimento.id}`;

    // Cria movimento de ajuste
    const novoMov = await criarMovimentoAjuste(movimento, valorAjuste, obs, transaction);

    // Atualiza saldo do adiantamento
    adiantamento.saldoAtual = Number(adiantamento.saldoAtual) + valorAjuste;
    await adiantamento.save({ transaction });

    await transaction.commit();
    console.log(`✅ Recomposição concluída. Saldo atualizado: ${adiantamento.saldoAtual}`);
    return { sucesso: true, ajuste: novoMov, novoSaldo: adiantamento.saldoAtual };
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Erro em recomporSaldo:', error);
    throw error;
  }
}

/**
 * Ajuste manual de saldo (uso futuro / administrativo)
 */
async function ajustarSaldoManual(adiantamentoId, valor, motivo) {
  const transaction = await sequelize.transaction();
  try {
    const adiantamento = await Adiantamento.findByPk(adiantamentoId, { transaction });
    if (!adiantamento) throw new Error('Adiantamento não encontrado');

    adiantamento.saldoAtual = Number(adiantamento.saldoAtual) + Number(valor);
    await adiantamento.save({ transaction });

    console.log(`🧮 Ajuste manual aplicado: ${valor} | Motivo: ${motivo}`);
    await transaction.commit();

    return { sucesso: true, novoSaldo: adiantamento.saldoAtual };
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Erro em ajustarSaldoManual:', error);
    throw error;
  }
}

module.exports = {
  estornarCredito,
  recomporSaldo,
  ajustarSaldoManual,
};
