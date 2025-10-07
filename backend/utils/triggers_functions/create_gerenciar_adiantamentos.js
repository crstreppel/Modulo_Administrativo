/* =============================================================
 * create_gerenciar_adiantamentos.js • v1.0
 * -------------------------------------------------------------
 * - Cria função + trigger para gerenciar adiantamentos
 * - Ignora CANCELADO (7) e AJUSTE (8)
 * -------------------------------------------------------------
*/

const { sequelize } = require('../../config/db');

async function createGerenciarAdiantamentos() {
  console.log('⚙️ Criando função fn_gerenciar_adiantamento()...');

  const sql = `
    DROP TRIGGER IF EXISTS trg_movimento_adiantamento ON public.movimentos;
    DROP FUNCTION IF EXISTS public.fn_gerenciar_adiantamento();

    CREATE FUNCTION public.fn_gerenciar_adiantamento()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    DECLARE
      v_id_meio_adiant  INTEGER;
      v_data_mov        DATE;
      v_consumir        NUMERIC(10,2);
      v_faltante        NUMERIC(10,2);
      v_adi_id          INTEGER;
      v_adi_saldo       NUMERIC(10,2);
      v_total_abatido   NUMERIC(10,2) := 0;
    BEGIN
      -- Ignora movimentos CANCELADO (7) ou AJUSTE (8)
      IF NEW."statusId" IN (7,8) THEN
        RETURN NEW;
      END IF;

      -- Só entra se for condição de adiantamento
      IF NEW."condicaoPagamentoId" <> 3 THEN
        RETURN NEW;
      END IF;

      v_data_mov := COALESCE(NEW.data_movimento, NEW.data_lancamento);

      -- Identifica meio de pagamento "adiantamento"
      SELECT id INTO v_id_meio_adiant
      FROM public.meio_de_pagamento
      WHERE descricao ILIKE 'adiant%'
      ORDER BY id
      LIMIT 1;

      -- ENTRADA (novo crédito)
      IF NEW."meioPagamentoId" IS DISTINCT FROM v_id_meio_adiant THEN
        INSERT INTO public.adiantamentos
          ("clienteId","petId","valorTotal","saldoAtual","dataPagamento","observacoes","status","createdAt","updatedAt")
        VALUES
          (NEW."clienteId", NEW."petId", NEW.valor, NEW.valor, v_data_mov, NEW.observacao, 'ativo', NOW(), NOW())
        RETURNING id INTO v_adi_id;

        UPDATE public.movimentos
           SET "statusId"       = 5,
               data_liquidacao  = v_data_mov,
               "adiantamentoId" = v_adi_id,
               "valorAbatidoAdiantamento" = NEW.valor,
               "observacao"     = COALESCE(NEW.observacao,'') || ' | Entrada de adiantamento'
         WHERE id = NEW.id;

        RETURN NEW;
      END IF;

      -- CONSUMO (abate FIFO)
      v_faltante := NEW.valor;

      FOR v_adi_id, v_adi_saldo IN
        SELECT a.id, a."saldoAtual"
        FROM public.adiantamentos a
        WHERE a."clienteId" = NEW."clienteId"
          AND a."petId"     = NEW."petId"
          AND a."status"   <> 'encerrado'
          AND a."saldoAtual" > 0
        ORDER BY a."dataPagamento" ASC, a.id ASC
        FOR UPDATE
      LOOP
        EXIT WHEN v_faltante <= 0;
        v_consumir := LEAST(v_faltante, v_adi_saldo);

        UPDATE public.adiantamentos
           SET "saldoAtual" = "saldoAtual" - v_consumir,
               "status"     = CASE WHEN ("saldoAtual" - v_consumir) <= 0 THEN 'encerrado' ELSE "status" END,
               "updatedAt"  = NOW()
         WHERE id = v_adi_id;

        v_faltante := v_faltante - v_consumir;
        v_total_abatido := v_total_abatido + v_consumir;
      END LOOP;

      -- Atualiza o movimento
      IF v_total_abatido = NEW.valor THEN
        UPDATE public.movimentos
           SET "statusId" = 5,
               data_liquidacao = v_data_mov,
               "valorAbatidoAdiantamento" = v_total_abatido,
               "observacao" = COALESCE(NEW.observacao,'') || 
                              ' | Liquidado via adiantamento: R$ ' || to_char(v_total_abatido, 'FM999999990.00')
         WHERE id = NEW.id;
      ELSIF v_total_abatido > 0 THEN
        UPDATE public.movimentos
           SET "statusId" = 2,
               "valorAbatidoAdiantamento" = v_total_abatido,
               "observacao" = COALESCE(NEW.observacao,'') || 
                              ' | Baixa parcial via adiantamento: R$ ' || to_char(v_total_abatido, 'FM999999990.00')
         WHERE id = NEW.id;
      ELSE
        RAISE EXCEPTION 'Saldo insuficiente para cliente %, pet %: necessário=%, disponível=0',
          NEW."clienteId", NEW."petId", NEW.valor;
      END IF;

      RETURN NEW;
    END;
    $$;

    CREATE TRIGGER trg_movimento_adiantamento
    AFTER INSERT ON public.movimentos
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_gerenciar_adiantamento();
  `;

  await sequelize.query(sql);
  console.log('✅ Função fn_gerenciar_adiantamento() criada.');
}

module.exports = { createGerenciarAdiantamentos };
