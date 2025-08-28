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
app.use('/api/status',      statusRoutes);
app.use('/api/servicos',    servicosRoutes);
app.use('/api/racas',       racasRoutes);
app.use('/api/clientes',    clientesRoutes);
app.use('/api/especies',    especieRoutes);
app.use('/api/condicoes-de-pagamento', condicaoDePagamentoRoutes);
app.use('/api/meios-de-pagamento',     meioDePagamentoRoutes);
app.use('/api/pets',        petsRoutes);
app.use('/api/tabela-de-precos', tabelaDePrecosRoutes);
app.use('/api/movimentos',  movimentosRoutes);
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
    await sequelize.query(`-- ==========================================================
-- 1/2) ADIANTAMENTO
-- Função: public.fn_gerenciar_adiantamento()
-- Gatilho: trg_movimento_adiantamento (AFTER INSERT ON public.movimentos)
--
-- Datas de negócio SEMPRE por NEW.data_movimento.
-- Adiantamento:
--   ENTRADA (meio != adiantamento): cria crédito e liquida no dia.
--   CONSUMO (meio  = adiantamento): baixa FIFO e liquida no dia.
-- ==========================================================

DROP TRIGGER IF EXISTS trg_movimento_adiantamento ON public.movimentos;
DROP FUNCTION IF EXISTS public.fn_gerenciar_adiantamento();

CREATE FUNCTION public.fn_gerenciar_adiantamento()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_id_meio_adiant  INTEGER;
  v_data_mov        DATE;
  v_adi_id          INTEGER;
  v_adi_saldo       NUMERIC(10,2);
  v_adi_data_pag    DATE;
BEGIN
  IF NEW."condicaoPagamentoId" <> 3 THEN
    RETURN NEW;
  END IF;

  v_data_mov := COALESCE(NEW.data_movimento, NEW.data_lancamento);

  SELECT id INTO v_id_meio_adiant
  FROM public.meio_de_pagamento
  WHERE descricao ILIKE 'adiant%'
  ORDER BY id
  LIMIT 1;

  -- ENTRADA
  IF NEW."meioPagamentoId" IS DISTINCT FROM v_id_meio_adiant THEN
    INSERT INTO public.adiantamentos
      ("clienteId","petId","valorTotal","saldoAtual","dataPagamento","observacoes","status","createdAt","updatedAt")
    VALUES
      (NEW."clienteId", NEW."petId", NEW.valor, NEW.valor, v_data_mov, NEW.observacao, 'ativo', NOW(), NOW())
    RETURNING id INTO v_adi_id;

    UPDATE public.movimentos
       SET "statusId"       = 5,
           data_liquidacao  = v_data_mov,
           "adiantamentoId" = v_adi_id
     WHERE id = NEW.id;

    RETURN NEW;
  END IF;

  -- CONSUMO
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

  UPDATE public.adiantamentos
     SET "saldoAtual" = "saldoAtual" - NEW.valor,
         "status"     = CASE WHEN ("saldoAtual" - NEW.valor) <= 0 THEN 'encerrado' ELSE "status" END,
         "updatedAt"  = NOW()
   WHERE id = v_adi_id;

  UPDATE public.movimentos
     SET "statusId"       = 5,
         data_liquidacao  = v_data_mov,
         "adiantamentoId" = v_adi_id
   WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_movimento_adiantamento
AFTER INSERT ON public.movimentos
FOR EACH ROW
EXECUTE FUNCTION public.fn_gerenciar_adiantamento(); `);

    // ============================
    // 2) TÍTULOS: função + trigger (REGRA ESTRITA com tabela de parcelas)
    // ============================
    await sequelize.query(`-- ==========================================================
-- 2/2) CONTAS A RECEBER  (REGRA ESTRITA)
-- Função: public.fn_gerar_titulos_contas_a_receber()
-- Gatilho: tr_gerar_titulos_contas_a_receber (AFTER INSERT/UPDATE ON public.movimentos)
--
-- Datas de negócio por NEW.data_movimento.
-- COND 1 (À VISTA): 1 título em aberto, vencimento = data_movimento.
-- COND 3 (ADIANTAMENTO):
--   - ENTRADA (meio != adiantamento): 1 título liquidado no dia.
--   - CONSUMO (meio  = adiantamento): não deve existir título.
-- OUTRAS CONDIÇÕES (≠1 e ≠3): usar EXCLUSIVAMENTE condicao_pagamento_parcelas.
--   - Se não houver parcelas para a condição: ERRO (modo estrito).
--   - Geração N parcelas: venc = data_movimento + dias_para_pagamento(parcela).
-- ==========================================================

DROP TRIGGER IF EXISTS tr_gerar_titulos_contas_a_receber ON public.movimentos;
DROP FUNCTION IF EXISTS public.fn_gerar_titulos_contas_a_receber();

CREATE FUNCTION public.fn_gerar_titulos_contas_a_receber()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  -- Status (ajuste se teus IDs forem outros)
  v_status_aberto     INTEGER := 1;  -- Em aberto
  v_status_liquidado  INTEGER := 5;  -- Liquidado

  -- Condições (IDs padrão do seed; se mudarem, a regra abaixo ainda cobre)
  v_condicao_avista       INTEGER := 1; -- "A VISTA"
  v_condicao_adiantamento INTEGER := 3; -- "ADIANTAMENTO"

  -- Meio "adiantamento"
  v_id_meio_adiant INTEGER;

  -- Vars do movimento
  v_mov_id      INTEGER := NEW."id";
  v_cliente_id  INTEGER := NEW."clienteId";
  v_valor       NUMERIC := NEW."valor";
  v_data_evt    DATE    := NEW."data_movimento";
  v_condicao_id INTEGER := NEW."condicaoPagamentoId";
  v_meio_id     INTEGER := NEW."meioPagamentoId";

  -- Parcelamento
  v_offsets     INTEGER[];
  v_n_parc      INTEGER;
  v_data_venc   DATE;

  -- Rateio de centavos
  v_cents_total INTEGER;
  v_cents_base  INTEGER;
  v_cents_diff  INTEGER;
  v_valor_parc  NUMERIC(12,2);

  -- Flags
  v_is_avista          BOOLEAN := FALSE;
  v_is_adiant_entrada  BOOLEAN := FALSE;
  v_is_adiant_consumo  BOOLEAN := FALSE;
BEGIN
  IF v_data_evt IS NULL THEN
    RAISE EXCEPTION 'data_movimento não pode ser NULL para geração de títulos (movimentoId=%).', v_mov_id;
  END IF;

  -- Soft delete: não mexe
  IF NEW."deletedAt" IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Meio adiantamento
  SELECT id INTO v_id_meio_adiant
  FROM public.meio_de_pagamento
  WHERE descricao ILIKE 'adiant%'
  ORDER BY id
  LIMIT 1;

  -- Classificações
  v_is_avista         := (v_condicao_id = v_condicao_avista);
  v_is_adiant_entrada := (v_condicao_id = v_condicao_adiantamento AND v_meio_id IS DISTINCT FROM v_id_meio_adiant);
  v_is_adiant_consumo := (v_condicao_id = v_condicao_adiantamento AND v_meio_id = v_id_meio_adiant);

  -- CONSUMO: remove títulos e sai
  IF v_is_adiant_consumo THEN
    DELETE FROM public."contas_a_receber" WHERE "movimentoId" = v_mov_id;
    RETURN NEW;
  END IF;

  -- Limpa títulos para idempotência
  DELETE FROM public."contas_a_receber" WHERE "movimentoId" = v_mov_id;

  -- À VISTA
  IF v_is_avista THEN
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

  -- ENTRADA de ADIANTAMENTO
  IF v_is_adiant_entrada THEN
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

  -- OUTRAS CONDIÇÕES: offsets SÓ pela tabela filha
  SELECT array_agg(cpp.dias_para_pagamento ORDER BY cpp.parcela_numero)
    INTO v_offsets
  FROM public.condicao_pagamento_parcelas cpp
  WHERE cpp.condicao_pagamento_id = v_condicao_id;

  IF v_offsets IS NULL OR array_length(v_offsets,1) = 0 THEN
    RAISE EXCEPTION 'Condição % sem parcelas definidas em condicao_pagamento_parcelas', v_condicao_id;
  END IF;

  v_n_parc := array_length(v_offsets, 1);

  -- Rateio
  v_cents_total := ROUND(v_valor * 100)::int;
  v_cents_base  := (v_cents_total / v_n_parc);
  v_cents_diff  := v_cents_total - (v_cents_base * v_n_parc);

  FOR i IN 1..v_n_parc LOOP
    v_valor_parc := (v_cents_base + CASE WHEN i <= v_cents_diff THEN 1 ELSE 0 END) / 100.0;
    v_data_venc  := (v_data_evt + make_interval(days => v_offsets[i]))::date;

    INSERT INTO public."contas_a_receber" (
      "clienteId","movimentoId","dataVencimento",
      "valorOriginal","valorPago","statusId","observacoes",
      "createdAt","updatedAt"
    ) VALUES (
      v_cliente_id, v_mov_id, v_data_venc,
      v_valor_parc, 0, v_status_aberto,
      format('Parcela %s/%s - offset %s dias.', i, v_n_parc, v_offsets[i]),
      NOW(), NOW()
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_gerar_titulos_contas_a_receber
AFTER INSERT OR UPDATE OF "clienteId","valor","data_movimento","condicaoPagamentoId","meioPagamentoId","deletedAt"
ON public.movimentos
FOR EACH ROW
EXECUTE FUNCTION public.fn_gerar_titulos_contas_a_receber();
`);

    console.log(`🔥 Servidor rodando em http://localhost:${PORT}`);
  } catch (error) {
    console.error('❌ Erro ao sincronizar com o banco:', error);
  }
});
