/* =============================================================
 * create_gerar_titulo_individual.js • v1.0
 * -------------------------------------------------------------
 * - Cria função + trigger de geração individual de títulos
 *   (contas_a_receber) com base no dia de vencimento do cliente.
 * - Ignora CANCELADO (7), AJUSTE (8) e deletedAt.
 * -------------------------------------------------------------
 * Autor: Claudião & Bruxão 🧙‍♂️
 * Projeto: Petropolitan - Módulo Pacotes de Banho (Vencimento Fixo)
 * ============================================================= */

const { sequelize } = require('../../config/db');

async function createGerarTituloIndividual() {
  console.log('⚙️ Criando função fn_gerar_titulo_individual()...');

  const sql = `
    -- Apaga trigger e função anteriores, se existirem
    DROP TRIGGER IF EXISTS tr_gerar_titulo_individual ON public.movimentos;
    DROP FUNCTION IF EXISTS public.fn_gerar_titulo_individual();

    -- =============================================================
    -- Função: fn_gerar_titulo_individual()
    -- Gera um único título em contas_a_receber com base no
    -- dia_pagamento definido no cliente.
    -- =============================================================
    CREATE FUNCTION public.fn_gerar_titulo_individual()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    DECLARE
      v_status_aberto     INTEGER := 2;
      v_status_liquidado  INTEGER := 5;
      v_status_cancelado  INTEGER := 7;
      v_status_ajuste     INTEGER := 8;
      v_mov_id            INTEGER := NEW."id";
      v_cliente_id        INTEGER := NEW."clienteId";
      v_valor             NUMERIC := NEW."valor";
      v_data_evt          DATE := NEW."data_movimento";
      v_condicao_id       INTEGER := NEW."condicaoPagamentoId";
      v_meio_id           INTEGER := NEW."meioPagamentoId";
      v_dia_pagamento     INTEGER;
      v_data_vencimento   DATE;
      v_ano INTEGER;
      v_mes INTEGER;
      v_dias_no_mes INTEGER;
    BEGIN
      -- Ignora movimentos cancelados, ajustes ou excluídos
      IF NEW."statusId" IN (v_status_cancelado, v_status_ajuste) OR NEW."deletedAt" IS NOT NULL THEN
        RETURN NEW;
      END IF;

      IF v_cliente_id IS NULL THEN
        RAISE EXCEPTION 'Movimento % sem clienteId definido.', v_mov_id;
      END IF;

      -- Obtém o dia_pagamento do cliente
      SELECT dia_pagamento INTO v_dia_pagamento
      FROM public.clientes
      WHERE id = v_cliente_id;

      IF v_dia_pagamento IS NULL THEN
        RAISE NOTICE 'Cliente % sem dia_pagamento definido. Nenhum título gerado.', v_cliente_id;
        RETURN NEW;
      END IF;

      -- Define o ano e mês base do movimento
      v_ano := EXTRACT(YEAR FROM v_data_evt);
      v_mes := EXTRACT(MONTH FROM v_data_evt);

      -- Se o dia_pagamento for menor que o dia do movimento, empurra pro próximo mês
      IF v_dia_pagamento < EXTRACT(DAY FROM v_data_evt) THEN
        v_mes := v_mes + 1;
        IF v_mes > 12 THEN
          v_mes := 1;
          v_ano := v_ano + 1;
        END IF;
      END IF;

      -- Calcula o último dia válido do mês (pra ajustar meses curtos)
      SELECT EXTRACT(DAY FROM (DATE_TRUNC('MONTH', MAKE_DATE(v_ano, v_mes, 1)) + INTERVAL '1 MONTH - 1 day'))::INTEGER
      INTO v_dias_no_mes;

      IF v_dia_pagamento > v_dias_no_mes THEN
        v_dia_pagamento := v_dias_no_mes;
      END IF;

      -- Calcula data de vencimento
      v_data_vencimento := MAKE_DATE(v_ano, v_mes, v_dia_pagamento);

      -- Remove títulos anteriores do mesmo movimento (reprocessamento seguro)
      DELETE FROM public."contas_a_receber" WHERE "movimentoId" = v_mov_id;

      -- Insere novo título
      INSERT INTO public."contas_a_receber" (
        "clienteId",
        "movimentoId",
        "dataVencimento",
        "valorOriginal",
        "valorPago",
        "statusId",
        "observacoes",
        "createdAt",
        "updatedAt"
      ) VALUES (
        v_cliente_id,
        v_mov_id,
        v_data_vencimento,
        v_valor,
        0,
        v_status_aberto,
        'Gerado automaticamente (vencimento fixo dia ' || v_dia_pagamento || ').',
        NOW(),
        NOW()
      );

      RETURN NEW;
    END;
    $$;

    -- =============================================================
    -- Trigger: tr_gerar_titulo_individual
    -- Dispara após cada novo movimento
    -- =============================================================
    CREATE TRIGGER tr_gerar_titulo_individual
    AFTER INSERT
    ON public.movimentos
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_gerar_titulo_individual();
  `;

  await sequelize.query(sql);
  console.log('✅ Função fn_gerar_titulo_individual() criada com sucesso.');
}

module.exports = { createGerarTituloIndividual };
