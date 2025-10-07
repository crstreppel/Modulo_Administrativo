/* =============================================================
 * create_gerar_titulos.js • v1.0
 * -------------------------------------------------------------
 * - Cria função + trigger de geração de títulos (contas a receber)
 * - Ignora CANCELADO (7), AJUSTE (8) e deletedAt
 * -------------------------------------------------------------
*/

const { sequelize } = require('../../config/db');

async function createGerarTitulos() {
  console.log('⚙️ Criando função fn_gerar_titulos_contas_a_receber()...');

  const sql = `
    DROP TRIGGER IF EXISTS tr_gerar_titulos_contas_a_receber ON public.movimentos;
    DROP FUNCTION IF EXISTS public.fn_gerar_titulos_contas_a_receber();

    CREATE FUNCTION public.fn_gerar_titulos_contas_a_receber()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    DECLARE
      v_status_aberto     INTEGER := 2;
      v_status_liquidado  INTEGER := 5;
      v_status_parcial    INTEGER := 3;
      v_condicao_avista       INTEGER := 1;
      v_condicao_adiantamento INTEGER := 3;
      v_id_meio_adiant INTEGER;
      v_mov_id INTEGER := NEW."id";
      v_cliente_id INTEGER := NEW."clienteId";
      v_valor NUMERIC := NEW."valor";
      v_valor_pago NUMERIC := NEW."valorAbatidoAdiantamento";
      v_data_evt DATE := NEW."data_movimento";
      v_condicao_id INTEGER := NEW."condicaoPagamentoId";
      v_meio_id INTEGER := NEW."meioPagamentoId";
      v_total_parcelas INTEGER;
      v_total_centavos INTEGER;
      v_base_parcela_cent INTEGER;
      v_resto_centavos INTEGER;
      v_i INTEGER := 0;
      v_parcela_centavos INTEGER;
      v_parcela_valor NUMERIC(10,2);
    BEGIN
      IF NEW."statusId" IN (7,8) OR NEW."deletedAt" IS NOT NULL THEN
        RETURN NEW;
      END IF;

      IF v_data_evt IS NULL THEN
        RAISE EXCEPTION 'data_movimento não pode ser NULL (movimentoId=%).', v_mov_id;
      END IF;

      SELECT id INTO v_id_meio_adiant
      FROM public.meio_de_pagamento
      WHERE descricao ILIKE 'adiant%'
      ORDER BY id
      LIMIT 1;

      DELETE FROM public."contas_a_receber" WHERE "movimentoId" = v_mov_id;

      IF v_condicao_id = v_condicao_adiantamento AND v_meio_id = v_id_meio_adiant THEN
        IF v_valor_pago < v_valor THEN
          INSERT INTO public."contas_a_receber" (
            "clienteId","movimentoId","dataVencimento",
            "valorOriginal","valorPago","statusId","observacoes",
            "createdAt","updatedAt"
          ) VALUES (
            v_cliente_id, v_mov_id, v_data_evt,
            v_valor - v_valor_pago, 0, v_status_parcial,
            'Título gerado do saldo não coberto pelo adiantamento',
            NOW(), NOW()
          );
        END IF;
        RETURN NEW;
      END IF;

      IF v_condicao_id = v_condicao_avista THEN
        INSERT INTO public."contas_a_receber" (
          "clienteId","movimentoId","dataVencimento",
          "valorOriginal","valorPago","statusId","observacoes",
          "createdAt","updatedAt"
        ) VALUES (
          v_cliente_id, v_mov_id, v_data_evt,
          v_valor, 0, v_status_aberto,
          'À vista: vencimento na data do movimento.',
          NOW(), NOW()
        );
        RETURN NEW;
      END IF;

      IF v_condicao_id = v_condicao_adiantamento AND v_meio_id IS DISTINCT FROM v_id_meio_adiant THEN
        INSERT INTO public."contas_a_receber" (
          "clienteId","movimentoId","dataVencimento","dataPagamento",
          "valorOriginal","valorPago","statusId","observacoes",
          "createdAt","updatedAt"
        ) VALUES (
          v_cliente_id, v_mov_id, v_data_evt, v_data_evt,
          v_valor, v_valor, v_status_liquidado,
          'Entrada de adiantamento: liquidado na data do movimento.',
          NOW(), NOW()
        );
        RETURN NEW;
      END IF;

      SELECT COUNT(*) INTO v_total_parcelas
      FROM public.condicao_pagamento_parcelas
      WHERE condicao_pagamento_id = v_condicao_id;

      IF v_total_parcelas IS NULL OR v_total_parcelas = 0 THEN
        INSERT INTO public."contas_a_receber" (
          "clienteId","movimentoId","dataVencimento",
          "valorOriginal","valorPago","statusId","observacoes",
          "createdAt","updatedAt"
        ) VALUES (
          v_cliente_id, v_mov_id, v_data_evt,
          v_valor, 0, v_status_aberto,
          'Condição parcelada sem cadastro: título único.',
          NOW(), NOW()
        );
        RETURN NEW;
      END IF;

      v_total_centavos := (v_valor * 100)::INTEGER;
      v_base_parcela_cent := v_total_centavos / v_total_parcelas;
      v_resto_centavos := v_total_centavos - (v_base_parcela_cent * v_total_parcelas);

      FOR v_i IN 1..v_total_parcelas LOOP
        v_parcela_centavos := v_base_parcela_cent + CASE WHEN v_i <= v_resto_centavos THEN 1 ELSE 0 END;
        v_parcela_valor := (v_parcela_centavos::NUMERIC) / 100.0;

        DECLARE v_dias INTEGER;
        BEGIN
          SELECT dias_para_pagamento INTO v_dias
          FROM public.condicao_pagamento_parcelas
          WHERE condicao_pagamento_id = v_condicao_id
          ORDER BY parcela_numero
          OFFSET (v_i - 1) LIMIT 1;

          INSERT INTO public."contas_a_receber" (
            "clienteId","movimentoId","dataVencimento",
            "valorOriginal","valorPago","statusId","observacoes",
            "createdAt","updatedAt"
          ) VALUES (
            v_cliente_id, v_mov_id, v_data_evt + (v_dias || ' days')::INTERVAL,
            v_parcela_valor, 0, v_status_aberto,
            'Parcela ' || v_i || ' de ' || v_total_parcelas,
            NOW(), NOW()
          );
        END;
      END LOOP;

      RETURN NEW;
    END;
    $$;

    CREATE TRIGGER tr_gerar_titulos_contas_a_receber
    AFTER INSERT OR UPDATE OF "clienteId","valor","data_movimento","condicaoPagamentoId","meioPagamentoId","deletedAt","valorAbatidoAdiantamento","statusId"
    ON public.movimentos
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_gerar_titulos_contas_a_receber();
  `;

  await sequelize.query(sql);
  console.log('✅ Função fn_gerar_titulos_contas_a_receber() criada.');
}

module.exports = { createGerarTitulos };
