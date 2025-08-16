/* Arquivo app.js */

const express = require('express');
const cors = require('cors');

const { sequelize } = require('./config/db'); // pega direto do config/db.js

// ===== Patch: flag de force via CLI/env =====
// Liga com: `node app.js --force` ou `FORCE_SYNC=1 node app.js`
// (Windows CMD: `set FORCE_SYNC=1 && node app.js`)
const FORCE_SYNC =
  process.argv.includes('--force') ||
  process.env.FORCE_SYNC === '1';

if (process.env.NODE_ENV === 'production' && FORCE_SYNC) {
  console.error('🚫 Bloqueado: force:true em produção.');
  process.exit(1);
}

console.log(FORCE_SYNC ? '⚠️ Rodando com force:true' : '✅ Rodando sem force:true');

// Rotas
const statusRoutes = require('./routes/statusRoutes');
const servicosRoutes = require('./routes/servicosRoutes');
const racasRoutes = require('./routes/racasRoutes');
const clientesRoutes = require('./routes/clientesRoutes');
const especieRoutes = require('./routes/especieRoutes');
const condicaoDePagamentoRoutes = require('./routes/condicaoDePagamentoRoutes');
const meioDePagamentoRoutes = require('./routes/meioDePagamentoRoutes');
const petsRoutes = require('./routes/petsRoutes');
const tabelaDePrecosRoutes = require('./routes/tabelaDePrecosRoutes');
const movimentosRoutes = require('./routes/movimentosRoutes');
const contasAReceberRoutes = require('./routes/contasAReceberRoutes');

const app = express();

// Importa as associações entre os models
require('./models/associations');

// Middlewares
app.use(cors());
app.use(express.json());

// Rota teste raiz
app.get('/', (req, res) => {
  res.send('API do Módulo Administrativo está rodando.');
});

// Define rotas
app.use('/api/status', statusRoutes);
app.use('/api/servicos', servicosRoutes);
app.use('/api/racas', racasRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/especies', especieRoutes);
app.use('/api/condicoes-de-pagamento', condicaoDePagamentoRoutes);
app.use('/api/meios-de-pagamento', meioDePagamentoRoutes);
app.use('/api/pets', petsRoutes);
app.use('/api/tabela-de-precos', tabelaDePrecosRoutes);
app.use('/api/movimentos', movimentosRoutes);
app.use('/api/contas-a-receber', contasAReceberRoutes); // rota OK

// Inicializa servidor
const PORT = 3000;

app.listen(PORT, async () => {
  try {
    // Em dev: recria tudo conforme a flag
    await sequelize.sync({ force: FORCE_SYNC, logging: false });

    // ============================
    // 1) ADIANTAMENTO: função + trigger
    // ============================
    await sequelize.query(`
      CREATE OR REPLACE FUNCTION public.fn_gerenciar_adiantamento() RETURNS trigger
      LANGUAGE plpgsql
      AS $fn$
      DECLARE
        v_id_meio_adiant  INTEGER;
        v_data_mov        DATE;
        v_adi_id          INTEGER;
        v_adi_saldo       NUMERIC(10,2);
        v_adi_data_pag    DATE;
      BEGIN
        -- Só atua em INSERT de cond=3 (adiantamento)
        IF NEW."condicaoPagamentoId" <> 3 THEN
          RETURN NEW;
        END IF;

        v_data_mov := COALESCE(NEW.data_movimento, NEW.data_lancamento);

        -- identifica o meio "adiantamento" pela descrição
        SELECT id INTO v_id_meio_adiant
        FROM public.meio_de_pagamento
        WHERE descricao ILIKE 'adiant%'      -- "Adiantamento", "Adiant.", etc.
        ORDER BY id
        LIMIT 1;

        -- ===== CASO A: CRÉDITO (depósito) => meio != 'adiantamento' =====
        IF NEW."meioPagamentoId" IS DISTINCT FROM v_id_meio_adiant THEN
          INSERT INTO public.adiantamentos
            ("clienteId","petId","valorTotal","saldoAtual","dataPagamento","observacoes","status","createdAt","updatedAt")
          VALUES
            (NEW."clienteId", NEW."petId", NEW.valor, NEW.valor, v_data_mov, NEW.observacao, 'ativo', NOW(), NOW())
          RETURNING id INTO v_adi_id;

          -- liquida o movimento no dia e amarra o adiantamento
          UPDATE public.movimentos
          SET "statusId" = 5,
              data_liquidacao = v_data_mov,
              "adiantamentoId" = v_adi_id
          WHERE id = NEW.id;

          RETURN NEW;
        END IF;

        -- ===== CASO B: DÉBITO (uso) => meio == 'adiantamento' =====
        -- pega o crédito mais antigo com saldo (FIFO simples)
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

        -- debita e encerra se zerar
        UPDATE public.adiantamentos
        SET "saldoAtual" = "saldoAtual" - NEW.valor,
            "status" = CASE WHEN ("saldoAtual" - NEW.valor) <= 0 THEN 'encerrado' ELSE "status" END,
            "updatedAt" = NOW()
        WHERE id = v_adi_id;

        -- liquida o movimento com a data do crédito original e amarra o adiantamento
        UPDATE public.movimentos
        SET "statusId" = 5,
            data_liquidacao = v_adi_data_pag,
            "adiantamentoId" = v_adi_id
        WHERE id = NEW.id;

        RETURN NEW;
      END;
      $fn$;
    `);

    await sequelize.query(`
      DO $do$
      DECLARE
        v_table_exists BOOLEAN;
        v_trigger_exists BOOLEAN;
      BEGIN
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema='public' AND table_name = 'movimentos'
        ) INTO v_table_exists;

        IF NOT v_table_exists THEN
          RAISE WARNING '🛑 Tabela "movimentos" não existe. Não dá pra criar a trigger!';
          RETURN;
        END IF;

        SELECT EXISTS (
          SELECT 1 FROM pg_trigger
          WHERE tgname = 'trg_movimento_adiantamento'
            AND tgrelid = 'public.movimentos'::regclass
        ) INTO v_trigger_exists;

        IF v_trigger_exists THEN
          RAISE NOTICE '🔁 Trigger já existe. Recriando...';
          DROP TRIGGER IF EXISTS trg_movimento_adiantamento ON public.movimentos;
        ELSE
          RAISE NOTICE '🚧 Trigger não existe. Criando...';
        END IF;

        CREATE TRIGGER trg_movimento_adiantamento
        AFTER INSERT ON public.movimentos
        FOR EACH ROW
        EXECUTE FUNCTION public.fn_gerenciar_adiantamento();

        RAISE NOTICE '✅ Trigger "trg_movimento_adiantamento" criada/atualizada com sucesso!';
      END $do$;
    `);

    // ============================
    // 2) TÍTULOS: função + trigger
    // ============================
    await sequelize.query(`
      DROP FUNCTION IF EXISTS public.fn_gerar_titulos_contas_a_receber() CASCADE;
      CREATE OR REPLACE FUNCTION public.fn_gerar_titulos_contas_a_receber() RETURNS trigger
      LANGUAGE plpgsql
      AS $$
      DECLARE
        v_vencimento date;
        v_parcelas        integer;
        v_total_cents     bigint;
        v_base_cents      bigint;
        v_resto_cents     bigint;
        v_i               integer := 0;
        r_parcela         record;  -- numero_parcela, dias_para_pagamento
        v_id_meio_adiant  integer; -- id do meio "Adiantamento"
      BEGIN
        -- Soft delete -> remove títulos
        IF NEW."deletedAt" IS NOT NULL THEN
          DELETE FROM public.contas_a_receber WHERE "movimentoId" = NEW.id;
          RETURN NEW;
        END IF;

        -- Idempotência: limpa títulos do movimento
        DELETE FROM public.contas_a_receber WHERE "movimentoId" = NEW.id;

        IF NEW.valor IS NULL OR NEW.valor = 0 THEN
          RETURN NEW;
        END IF;

        -- pega id do meio "Adiantamento" (se existir)
        SELECT id INTO v_id_meio_adiant
        FROM public.meio_de_pagamento
        WHERE descricao ILIKE 'adiant%'
        ORDER BY id
        LIMIT 1;

        -- REGRA: NÃO GERA TÍTULO para "baixa de adiantamento"
        -- (cond=3 e meio = Adiantamento) -> apenas contábil
        IF NEW."condicaoPagamentoId" = 3 AND NEW."meioPagamentoId" IS NOT NULL
           AND v_id_meio_adiant IS NOT NULL
           AND NEW."meioPagamentoId" = v_id_meio_adiant THEN
          RETURN NEW;
        END IF;

        -- À vista (1) OU Adiantamento (3) com meio != Adiantamento => 1 título liquidado
        IF NEW."condicaoPagamentoId" IN (1, 3) THEN
          v_vencimento := COALESCE(NEW.data_movimento, NEW.data_lancamento);

          INSERT INTO public.contas_a_receber
            ("clienteId","movimentoId","dataVencimento","dataPagamento",
             "valorOriginal","valorPago","statusId","observacoes","createdAt","updatedAt",
             "nomeContato","telefoneContato")
          VALUES
            (
              NEW."clienteId",
              NEW.id,
              v_vencimento,
              COALESCE(NEW.data_liquidacao, v_vencimento),
              NEW.valor,
              NEW.valor,
              COALESCE(NEW."statusId", 5),
              NULL,
              NOW(), NOW(),
              '', ''
            );

          RETURN NEW;
        END IF;

        -- Demais condições: usa as parcelas da condicao_pagamento_parcelas
        SELECT COUNT(*)::int
        INTO v_parcelas
        FROM public.condicao_pagamento_parcelas cpp
        WHERE cpp.condicao_pagamento_id = NEW."condicaoPagamentoId";

        IF v_parcelas > 0 THEN
          v_total_cents := ROUND(NEW.valor * 100)::bigint;
          v_base_cents  := v_total_cents / v_parcelas;
          v_resto_cents := v_total_cents % v_parcelas;
          v_i := 0;

          FOR r_parcela IN
            SELECT numero_parcela, dias_para_pagamento
            FROM public.condicao_pagamento_parcelas
            WHERE condicao_pagamento_id = NEW."condicaoPagamentoId"
            ORDER BY numero_parcela
          LOOP
            v_i := v_i + 1;
            v_vencimento := (NEW.data_lancamento + make_interval(days => COALESCE(r_parcela.dias_para_pagamento,0)))::date;

            INSERT INTO public.contas_a_receber
              ("clienteId","movimentoId","dataVencimento","dataPagamento",
               "valorOriginal","valorPago","statusId","observacoes","createdAt","updatedAt",
               "nomeContato","telefoneContato")
            VALUES
              (
                NEW."clienteId",
                NEW.id,
                v_vencimento,
                NULL,
                ((v_base_cents + CASE WHEN v_i <= v_resto_cents THEN 1 ELSE 0 END)::numeric / 100.0),
                0,
                1,
                NULL,
                NOW(), NOW(),
                '', ''
              );
          END LOOP;

          RETURN NEW;
        END IF;

        -- Fallback: sem parcelas cadastradas -> 1 título simples
        v_vencimento := COALESCE(NEW.data_vencimento, NEW.data_lancamento);

        INSERT INTO public.contas_a_receber
          ("clienteId","movimentoId","dataVencimento","dataPagamento",
           "valorOriginal","valorPago","statusId","observacoes","createdAt","updatedAt",
           "nomeContato","telefoneContato")
        VALUES
          (NEW."clienteId", NEW.id, v_vencimento, NULL, NEW.valor, 0, 1, NULL, NOW(), NOW(), '', '');

        RETURN NEW;
      END;
      $$;
    `);

    await sequelize.query(`
      DO $do$
      DECLARE
        v_table_exists BOOLEAN;
        v_trigger_exists BOOLEAN;
      BEGIN
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema='public' AND table_name = 'movimentos'
        ) INTO v_table_exists;

        IF NOT v_table_exists THEN
          RAISE WARNING '🛑 Tabela "movimentos" não existe. Não dá pra criar a trigger de títulos!';
          RETURN;
        END IF;

        SELECT EXISTS (
          SELECT 1 FROM pg_trigger
          WHERE tgname = 'tr_gerar_titulos_contas_a_receber'
            AND tgrelid = 'public.movimentos'::regclass
        ) INTO v_trigger_exists;

        IF v_trigger_exists THEN
          RAISE NOTICE '🔁 Trigger de títulos já existe. Recriando...';
          DROP TRIGGER IF EXISTS tr_gerar_titulos_contas_a_receber ON public.movimentos;
        ELSE
          RAISE NOTICE '🚧 Trigger de títulos não existe. Criando...';
        END IF;

        CREATE TRIGGER tr_gerar_titulos_contas_a_receber
        AFTER INSERT OR UPDATE OF "clienteId", valor, data_lancamento, data_movimento, data_vencimento,
                                 "condicaoPagamentoId", "statusId", data_liquidacao, "deletedAt", "meioPagamentoId"
        ON public.movimentos
        FOR EACH ROW
        EXECUTE FUNCTION public.fn_gerar_titulos_contas_a_receber();

        RAISE NOTICE '✅ Trigger "tr_gerar_titulos_contas_a_receber" criada/atualizada com sucesso!';
      END $do$;
    `);

    console.log(`🔥 Servidor rodando em http://localhost:${PORT}`);
  } catch (error) {
    console.error('❌ Erro ao sincronizar com o banco:', error);
  }
});
