-- 1. Remove a trigger antiga, se existir
DROP TRIGGER IF EXISTS tr_gerar_titulos_contas_a_receber ON movimentos;

-- 2. Remove a função antiga, se existir
DROP FUNCTION IF EXISTS fn_gerar_titulos_contas_a_receber();

-- 3. Cria a função nova
CREATE FUNCTION fn_gerar_titulos_contas_a_receber() RETURNS trigger AS $$
DECLARE
  v_dias_pagamento INTEGER;
  v_data_vencimento DATE;
BEGIN
  -- Se for condição de pagamento 1 (à vista), não gera título
  IF NEW."condicaoPagamentoId" = 1 THEN
    RETURN NEW;
  END IF;

  -- Pega os dias para pagamento da parcela 1 da condição de pagamento do movimento
  SELECT cpp.dias_para_pagamento
  INTO v_dias_pagamento
  FROM condicao_pagamento_parcelas cpp
  WHERE cpp.condicao_pagamento_id = NEW."condicaoPagamentoId"
    AND cpp.numero_parcela = 1
  LIMIT 1;

  -- Calcula a data de vencimento somando dias à data do movimento
  v_data_vencimento := NEW.data_movimento + make_interval(days => v_dias_pagamento);

  -- Insere na tabela contas_a_receber
  INSERT INTO contas_a_receber (
    "clienteId",
    "nomeContato",
    "telefoneContato",
    "movimentoId",
    "dataVencimento",
    "dataPagamento",
    "valorOriginal",
    "valorPago",
    "statusId",
    "observacoes",
    "createdAt",
    "updatedAt"
  ) VALUES (
    NEW."clienteId",
    NULL, -- nomeContato vindo do módulo bancos depois
    NULL, -- telefoneContato vindo do módulo bancos depois
    NEW.id,
    v_data_vencimento,
    NULL,
    NEW.valor,
    0,
    NEW."statusId",
    NULL,
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Cria a trigger nova
CREATE TRIGGER tr_gerar_titulos_contas_a_receber
AFTER INSERT ON movimentos
FOR EACH ROW
WHEN (NEW."condicaoPagamentoId" <> 1)  -- só dispara a função se condicaoPagamentoId for diferente de 1
EXECUTE FUNCTION fn_gerar_titulos_contas_a_receber();
