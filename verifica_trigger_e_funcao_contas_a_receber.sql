-- ============================================
--  CONTAS A RECEBER - GERAÇÃO DE TÍTULOS (FIX)
--  Ajuste: usar a tabela física public."contas_a_receber"
-- ============================================

-- 0) Limpeza
DROP TRIGGER IF EXISTS tr_gerar_titulos_contas_a_receber ON movimentos;
DROP FUNCTION IF EXISTS fn_gerar_titulos_contas_a_receber();

-- 1) Função
CREATE FUNCTION fn_gerar_titulos_contas_a_receber() RETURNS trigger AS $$
DECLARE
  -- Ajuste aqui se seus IDs forem diferentes:
  v_status_aberto     INTEGER := 1;  -- status "Em aberto" no CR
  v_status_liquidado  INTEGER := 5;  -- status "Liquidado" no CR

  -- Constantes do negócio
  v_condicao_avista       INTEGER := 1;
  v_condicao_adiantamento INTEGER := 3;
  v_meio_adiantamento     INTEGER := 3;

  v_mov_id        INTEGER := NEW."id";
  v_cliente_id    INTEGER := NEW."clienteId";
  v_valor         NUMERIC := NEW."valor";
  v_data_lcto     DATE    := NEW."data_lancamento";
  v_condicao_id   INTEGER := NEW."condicaoPagamentoId";
  v_meio_id       INTEGER := NEW."meioPagamentoId";

  v_cr_id         INTEGER;
  v_is_adiant_entrada BOOLEAN;
  v_is_adiant_consumo BOOLEAN;
  v_is_avista BOOLEAN;
BEGIN
  -- Se o movimento estiver soft-deletado, encerra
  IF NEW."deletedAt" IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Classificações
  v_is_avista := (v_condicao_id = v_condicao_avista);
  v_is_adiant_entrada := (v_condicao_id = v_condicao_adiantamento AND v_meio_id IS DISTINCT FROM v_meio_adiantamento);
  v_is_adiant_consumo := (v_condicao_id = v_condicao_adiantamento AND v_meio_id = v_meio_adiantamento);

  -- Busca CR existente (não soft-deletado) pro movimento
  SELECT car.id
    INTO v_cr_id
  FROM public."contas_a_receber" car
  WHERE car."movimentoId" = v_mov_id
    AND car."deletedAt" IS NULL
  LIMIT 1;

  -- Consumo de adiantamento -> NÃO deve existir CR
  IF v_is_adiant_consumo THEN
    IF v_cr_id IS NOT NULL THEN
      DELETE FROM public."contas_a_receber" WHERE id = v_cr_id;
    END IF;
    RETURN NEW;
  END IF;

  -- À VISTA -> cria/atualiza CR em aberto, vencimento = data_lancamento
  IF v_is_avista THEN
    IF v_cr_id IS NULL THEN
      INSERT INTO public."contas_a_receber" (
        "clienteId","movimentoId","dataVencimento",
        "valorOriginal","valorPago","statusId","observacoes",
        "createdAt","updatedAt"
      ) VALUES (
        v_cliente_id, v_mov_id, v_data_lcto,
        v_valor, 0, v_status_aberto, 'Título gerado automaticamente (à vista).',
        NOW(), NOW()
      );
    ELSE
      UPDATE public."contas_a_receber"
         SET "clienteId"      = v_cliente_id,
             "dataVencimento" = v_data_lcto,
             "valorOriginal"  = v_valor,
             "statusId"       = CASE WHEN "dataPagamento" IS NOT NULL AND "valorPago" >= v_valor
                                      THEN v_status_liquidado ELSE v_status_aberto END,
             "observacoes"    = 'Título atualizado automaticamente (à vista).',
             "updatedAt"      = NOW()
       WHERE id = v_cr_id;
    END IF;

    RETURN NEW;
  END IF;

  -- ENTRADA de ADIANTAMENTO -> cria/atualiza CR LIQUIDADO no mesmo dia
  IF v_is_adiant_entrada THEN
    IF v_cr_id IS NULL THEN
      INSERT INTO public."contas_a_receber" (
        "clienteId","movimentoId","dataVencimento","dataPagamento",
        "valorOriginal","valorPago","statusId","observacoes",
        "createdAt","updatedAt"
      ) VALUES (
        v_cliente_id, v_mov_id, v_data_lcto, v_data_lcto,
        v_valor, v_valor, v_status_liquidado,
        'Título gerado automaticamente (entrada de adiantamento) e liquidado no dia.',
        NOW(), NOW()
      );
    ELSE
      UPDATE public."contas_a_receber"
         SET "clienteId"      = v_cliente_id,
             "dataVencimento" = v_data_lcto,
             "dataPagamento"  = v_data_lcto,
             "valorOriginal"  = v_valor,
             "valorPago"      = v_valor,
             "statusId"       = v_status_liquidado,
             "observacoes"    = 'Título atualizado automaticamente (entrada de adiantamento) e liquidado no dia.',
             "updatedAt"      = NOW()
       WHERE id = v_cr_id;
    END IF;

    RETURN NEW;
  END IF;

  -- Outras condições: deixa para outra rotina/trigger específica
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2) Trigger
CREATE TRIGGER tr_gerar_titulos_contas_a_receber
AFTER INSERT OR UPDATE OF "clienteId","valor","data_lancamento","condicaoPagamentoId","meioPagamentoId","deletedAt"
ON movimentos
FOR EACH ROW
EXECUTE FUNCTION fn_gerar_titulos_contas_a_receber();
