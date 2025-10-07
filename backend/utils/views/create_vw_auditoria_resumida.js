/* =============================================================
 * create_vw_auditoria_resumida.js • v2.0 — Padrão Bruxão 🧙‍♂️
 * -------------------------------------------------------------
 * - Consolida Movimentos x Títulos x Adiantamentos
 * - Inclui flag de situação (🟢 OK / 🟡 ABERTO / 🔴 CANCELADO)
 * -------------------------------------------------------------
*/

const { sequelize } = require('../../config/db');

async function createViewAuditoriaResumida() {
  console.log('🧩 Criando view vw_auditoria_resumida...');

  const sql = `
    DROP VIEW IF EXISTS public.vw_auditoria_resumida;

    CREATE OR REPLACE VIEW public.vw_auditoria_resumida AS
    SELECT
      m.id                      AS movimento_id,
      m.data_movimento,
      m.valor                   AS valor_movimento,
      cp.descricao               AS condicao_pagamento,
      mp.descricao               AS meio_pagamento,
      s.descricao                AS status_movimento,
      m.observacao,
      m."adiantamentoId",
      a."saldoAtual"             AS saldo_adiantamento,
      a."valorTotal"             AS valor_total_adiantamento,
      a."status"                 AS status_adiantamento,
      cr.id                      AS titulo_id,
      cr."valorOriginal"         AS valor_titulo,
      cr."valorPago"             AS valor_pago_titulo,
      st.descricao               AS status_titulo,
      cr."dataVencimento",
      cr."dataPagamento",
      c.nome                     AS cliente,
      p.nome                     AS pet,
      sv.descricao               AS servico,
      CASE
        WHEN m."statusId" = 7 THEN '🔴 CANCELADO'
        WHEN m."statusId" = 8 THEN '🟠 AJUSTE'
        WHEN st.descricao ILIKE 'aberto%' THEN '🟡 ABERTO'
        WHEN st.descricao ILIKE 'liquidado%' OR m."statusId" = 5 THEN '🟢 OK'
        ELSE '⚪ INDEFINIDO'
      END AS situacao_financeira
    FROM public.movimentos m
    LEFT JOIN public."contas_a_receber" cr ON cr."movimentoId" = m.id
    LEFT JOIN public.adiantamentos a ON a.id = m."adiantamentoId"
    LEFT JOIN public.clientes c ON c.id = m."clienteId"
    LEFT JOIN public.pets p ON p.id = m."petId"
    LEFT JOIN public.servicos sv ON sv.id = m."servicoId"
    LEFT JOIN public.condicao_de_pagamento cp ON cp.id = m."condicaoPagamentoId"
    LEFT JOIN public.meio_de_pagamento mp ON mp.id = m."meioPagamentoId"
    LEFT JOIN public.status s ON s.id = m."statusId"
    LEFT JOIN public.status st ON st.id = cr."statusId"
    ORDER BY m."data_movimento" DESC, m.id DESC;
  `;

  await sequelize.query(sql);
  console.log('✅ View vw_auditoria_resumida criada com sucesso.');
}

module.exports = { createViewAuditoriaResumida };
