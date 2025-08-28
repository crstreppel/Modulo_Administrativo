-- ==========================================================
-- 2/2) CONTAS A RECEBER
-- Função: public.fn_gerar_titulos_contas_a_receber()
-- Gatilho: tr_gerar_titulos_contas_a_receber (AFTER INSERT/UPDATE ON public.movimentos)
--
-- Regras (padrão bruxão):
-- - Em lançamentos retroativos, "data_lancamento" é só auditoria.
-- - TODAS as datas de negócio aqui derivam de NEW.data_movimento.
-- - À VISTA (cond=1): cria/atualiza título **em aberto** com vencimento = data_movimento.
-- - ADIANTAMENTO:
--     * ENTRADA (meio != 'adiantamento'): cria/atualiza título **liquidado** no próprio dia (data_pagto = data_movimento).
--     * CONSUMO (meio  = 'adiantamento'): **não** deve existir título; se existir, remove.
-- ==========================================================

-- 0) Limpeza
DROP TRIGGER IF EXISTS tr_gerar_titulos_contas_a_receber ON public.movimentos;
DROP FUNCTION IF EXISTS public.fn_gerar_titulos_contas_a_receber();

-- 1) Função
CREATE FUNCTION public.fn_gerar_titulos_contas_a_receber()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  -- IDs de status no módulo de CR (ajuste se necessário)
  v_status_aberto     INTEGER := 1;  -- Em aberto
  v_status_liquidado  INTEGER := 5;  -- Liquidado

  -- Constantes do negócio
  v_condicao_avista       INTEGER := 1;
  v_condicao_adiantamento INTEGER := 3;

  -- Descobrir o meio "adiantamento" por descrição (evita magic number)
  v_id_meio_adiant INTEGER;

  -- Variáveis do movimento
  v_mov_id      INTEGER := NEW."id";
  v_cliente_id  INTEGER := NEW."clienteId";
  v_valor       NUMERIC := NEW."valor";
  v_data_evt    DATE    := COALESCE(NEW."data_movimento", NEW."data_lancamento");
  v_condicao_id INTEGER := NEW."condicaoPagamentoId";
  v_meio_id     INTEGER := NEW."meioPagamentoId";

  -- Auxiliares
  v_cr_id              INTEGER;
  v_is_avista          BOOLEAN;
  v_is_adiant_entrada  BOOLEAN;
  v_is_adiant_consumo  BOOLEAN;
BEGIN
  -- Se o movimento foi soft-deletado, não mexe em CR aqui
  IF NEW."deletedAt" IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Id do meio "adiantamento"
  SELECT id INTO v_id_meio_adiant
  FROM public.meio_de_pagamento
  WHERE descricao ILIKE 'adiant%'
  ORDER BY id
  LIMIT 1;

  -- Classificações
  v_is_avista         := (v_condicao_id = v_condicao_avista);
  v_is_adiant_entrada := (v_condicao_id = v_condicao_adiantamento AND v_meio_id IS DISTINCT FROM v_id_meio_adiant);
  v_is_adiant_consumo := (v_condicao_id = v_condicao_adiantamento AND v_meio_id = v_id_meio_adiant);

  -- Busca CR existente (não soft-deletado) para o movimento
  SELECT car.id
    INTO v_cr_id
  FROM public."contas_a_receber" car
  WHERE car."movimentoId" = v_mov_id
    AND car."deletedAt" IS NULL
  LIMIT 1;

  -- CONSUMO DE ADIANTAMENTO: não deve existir título
  IF v_is_adiant_consumo THEN
    IF v_cr_id IS NOT NULL THEN
      DELETE FROM public."contas_a_receber" WHERE id = v_cr_id;
    END IF;
    RETURN NEW;
  END IF;

  -- À VISTA: título EM ABERTO, vencimento = data do evento
  IF v_is_avista THEN
    IF v_cr_id IS NULL THEN
      INSERT INTO public."contas_a_receber" (
        "clienteId","movimentoId","dataVencimento",
        "valorOriginal","valorPago","statusId","observacoes",
        "createdAt","updatedAt"
      ) VALUES (
        v_cliente_id, v_mov_id, v_data_evt,
        v_valor, 0, v_status_aberto,
        'Título gerado automaticamente (à vista).',
        NOW(), NOW()
      );
    ELSE
      UPDATE public."contas_a_receber"
         SET "clienteId"      = v_cliente_id,
             "dataVencimento" = v_data_evt,
             "valorOriginal"  = v_valor,
             "statusId"       = CASE
                                  WHEN "dataPagamento" IS NOT NULL AND "valorPago" >= v_valor
                                    THEN v_status_liquidado
                                  ELSE v_status_aberto
                                END,
             "observacoes"    = 'Título atualizado automaticamente (à vista).',
             "updatedAt"      = NOW()
       WHERE id = v_cr_id;
    END IF;

    RETURN NEW;
  END IF;

  -- ENTRADA DE ADIANTAMENTO: título LIQUIDADO no dia do evento
  IF v_is_adiant_entrada THEN
    IF v_cr_id IS NULL THEN
      INSERT INTO public."contas_a_receber" (
        "clienteId","movimentoId","dataVencimento","dataPagamento",
        "valorOriginal","valorPago","statusId","observacoes",
        "createdAt","updatedAt"
      ) VALUES (
        v_cliente_id, v_mov_id, v_data_evt, v_data_evt,
        v_valor, v_valor, v_status_liquidado,
        'Título gerado automaticamente (entrada de adiantamento) e liquidado no dia.',
        NOW(), NOW()
      );
    ELSE
      UPDATE public."contas_a_receber"
         SET "clienteId"      = v_cliente_id,
             "dataVencimento" = v_data_evt,
             "dataPagamento"  = v_data_evt,
             "valorOriginal"  = v_valor,
             "valorPago"      = v_valor,
             "statusId"       = v_status_liquidado,
             "observacoes"    = 'Título atualizado automaticamente (entrada de adiantamento) e liquidado no dia.',
             "updatedAt"      = NOW()
       WHERE id = v_cr_id;
    END IF;

    RETURN NEW;
  END IF;

  -- Outras condições: nada a fazer aqui (pode haver outra rotina específica)
  RETURN NEW;
END;
$$;

-- 2) Trigger (inclui UPDATE de campos relevantes; note o uso de data_movimento em vez de data_lancamento)
CREATE TRIGGER tr_gerar_titulos_contas_a_receber
AFTER INSERT OR UPDATE OF "clienteId","valor","data_movimento","condicaoPagamentoId","meioPagamentoId","deletedAt"
ON public.movimentos
FOR EACH ROW
EXECUTE FUNCTION public.fn_gerar_titulos_contas_a_receber();
