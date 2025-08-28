-- ==========================================================
-- 1/2) ADIANTAMENTO
-- Função: public.fn_gerenciar_adiantamento()
-- Gatilho: trg_movimento_adiantamento (AFTER INSERT ON public.movimentos)
--
-- Regras (padrão bruxão):
-- - Em lançamentos retroativos, "data_lancamento" é só auditoria.
-- - TODAS as datas de negócio derivam de NEW.data_movimento.
-- - Para cond=3 (adiantamento):
--     * ENTRADA (depósito): meio != "adiantamento"  -> cria crédito em adiantamentos
--       e liquida o movimento em NEW.data_movimento.
--     * CONSUMO (baixa):   meio  = "adiantamento"  -> abate do crédito FIFO e
--       liquida o movimento em NEW.data_movimento.
--   (NUNCA usar a data do crédito original para a liquidação do consumo.)
-- ==========================================================

-- Tira o gatilho do caminho para recriar com segurança
DROP TRIGGER IF EXISTS trg_movimento_adiantamento ON public.movimentos;

-- Remove a função antiga (se existir)
DROP FUNCTION IF EXISTS public.fn_gerenciar_adiantamento();

-- Cria/atualiza a função
CREATE FUNCTION public.fn_gerenciar_adiantamento()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_id_meio_adiant  INTEGER;       -- id do meio "Adiantamento" (detectado por descrição ILIKE 'adiant%')
  v_data_mov        DATE;          -- data do evento (sempre base para liquidação)
  v_adi_id          INTEGER;       -- adiantamento afetado (entrada criada ou crédito consumido)
  v_adi_saldo       NUMERIC(10,2); -- saldo do crédito selecionado
  v_adi_data_pag    DATE;          -- data do crédito (mantido no SELECT apenas para logging/consulta)
BEGIN
  -- Atua apenas para movimentos de ADIANTAMENTO (condicaoPagamentoId = 3)
  IF NEW."condicaoPagamentoId" <> 3 THEN
    RETURN NEW;
  END IF;

  -- Base de datas SEMPRE = data do evento
  v_data_mov := COALESCE(NEW.data_movimento, NEW.data_lancamento);

  -- Descobre o meio "adiantamento" pela descrição (evita magic number)
  SELECT id
    INTO v_id_meio_adiant
  FROM public.meio_de_pagamento
  WHERE descricao ILIKE 'adiant%'          -- "Adiantamento", "Adiant.", etc.
  ORDER BY id
  LIMIT 1;

  -- =============== CASO A: ENTRADA (depósito) => meio != "adiantamento" ===============
  IF NEW."meioPagamentoId" IS DISTINCT FROM v_id_meio_adiant THEN
    INSERT INTO public.adiantamentos
      ("clienteId","petId","valorTotal","saldoAtual","dataPagamento","observacoes","status","createdAt","updatedAt")
    VALUES
      (NEW."clienteId", NEW."petId", NEW.valor, NEW.valor, v_data_mov, NEW.observacao, 'ativo', NOW(), NOW())
    RETURNING id INTO v_adi_id;

    -- Liquida o movimento no dia do evento e amarra o adiantamento gerado
    UPDATE public.movimentos
       SET "statusId"       = 5,
           data_liquidacao  = v_data_mov,
           "adiantamentoId" = v_adi_id
     WHERE id = NEW.id;

    RETURN NEW;
  END IF;

  -- =============== CASO B: CONSUMO (baixa) => meio = "adiantamento" ===============
  -- Seleciona o crédito mais antigo com saldo (FIFO)
  SELECT a.id, a."saldoAtual", a."dataPagamento"
    INTO v_adi_id, v_adi_saldo, v_adi_data_pag
  FROM public.adiantamentos a
  WHERE a."clienteId" = NEW."clienteId"
    AND a."petId"     = NEW."petId"
    AND a."status"   <> 'encerrado'
    AND a."saldoAtual" > 0
  ORDER BY a."dataPagamento" ASC, a.id ASC
  LIMIT 1
  FOR UPDATE;

  IF v_adi_id IS NULL THEN
    RAISE EXCEPTION 'Não há adiantamento com saldo para cliente % / pet %', NEW."clienteId", NEW."petId";
  END IF;

  IF v_adi_saldo < NEW.valor THEN
    RAISE EXCEPTION 'Saldo do adiantamento (id=%) insuficiente: saldo=%, necessário=%',
      v_adi_id, v_adi_saldo, NEW.valor;
  END IF;

  -- Debita e encerra quando zerar
  UPDATE public.adiantamentos
     SET "saldoAtual" = "saldoAtual" - NEW.valor,
         "status"     = CASE WHEN ("saldoAtual" - NEW.valor) <= 0 THEN 'encerrado' ELSE "status" END,
         "updatedAt"  = NOW()
   WHERE id = v_adi_id;

  -- Liquida o movimento **na data do evento** e amarra ao crédito consumido
  UPDATE public.movimentos
     SET "statusId"       = 5,
         data_liquidacao  = v_data_mov,
         "adiantamentoId" = v_adi_id
   WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- Recria o gatilho apontando para a função corrigida
CREATE TRIGGER trg_movimento_adiantamento
AFTER INSERT ON public.movimentos
FOR EACH ROW
EXECUTE FUNCTION public.fn_gerenciar_adiantamento();
