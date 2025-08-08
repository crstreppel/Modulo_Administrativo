DO $$
DECLARE
  v_table_exists BOOLEAN;
  v_func_exists BOOLEAN;
  v_trigger_exists BOOLEAN;
BEGIN
  -- Verifica se a tabela 'movimentos' existe
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'movimentos'
  ) INTO v_table_exists;

  -- Verifica se a função 'fn_gerenciar_adiantamento' existe
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'fn_gerenciar_adiantamento'
  ) INTO v_func_exists;

  IF v_table_exists THEN
    IF v_func_exists THEN

      -- Verifica se a trigger já existe
      SELECT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_movimento_adiantamento'
          AND tgrelid = 'movimentos'::regclass
      ) INTO v_trigger_exists;

      IF v_trigger_exists THEN
        RAISE NOTICE '🔁 Trigger já existe. Vamos recriar só por garantia...';
        DROP TRIGGER IF EXISTS trg_movimento_adiantamento ON movimentos;
      ELSE
        RAISE NOTICE '🚧 Trigger ainda não existe. Criando agora...';
      END IF;

      -- Cria a trigger
      CREATE TRIGGER trg_movimento_adiantamento
      AFTER INSERT ON movimentos
      FOR EACH ROW
      EXECUTE FUNCTION fn_gerenciar_adiantamento();

      RAISE NOTICE '✅ Trigger "trg_movimento_adiantamento" criada com sucesso!';

    ELSE
      RAISE WARNING '⚠️ Função "fn_gerenciar_adiantamento" não existe. Criação da trigger abortada!';
    END IF;
  ELSE
    RAISE WARNING '🛑 Tabela "movimentos" não existe. Não dá pra criar a trigger!';
  END IF;
END $$;
