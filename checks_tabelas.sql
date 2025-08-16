-- ============================================
-- CHECKS + ÍNDICES (SEGURANÇA / INTEGRIDADE)
-- Projeto: Petshop
-- ============================================

BEGIN;

-- ---------------------------
-- TABELA: tabela_de_precos
-- ---------------------------

-- Remove resquício do campo antigo (se existir)
ALTER TABLE tabela_de_precos
  DROP COLUMN IF EXISTS "meioDePagamentoId";

-- XOR: exatamente um entre petId e racaId
ALTER TABLE tabela_de_precos
  DROP CONSTRAINT IF EXISTS chk_pet_xor_raca;

ALTER TABLE tabela_de_precos
  ADD CONSTRAINT chk_pet_xor_raca
  CHECK ( ("petId" IS NOT NULL) <> ("racaId" IS NOT NULL) ) NOT VALID;

-- Valor de serviço positivo
ALTER TABLE tabela_de_precos
  DROP CONSTRAINT IF EXISTS chk_preco_valor_pos;

ALTER TABLE tabela_de_precos
  ADD CONSTRAINT chk_preco_valor_pos
  CHECK ("valorServico" > 0) NOT VALID;

-- Únicos parciais (evita duplicidade levando em conta soft delete)
-- Para PET
CREATE UNIQUE INDEX IF NOT EXISTS uq_tprecos_servico_cond_pet
  ON tabela_de_precos ("servicoId","condicaoDePagamentoId","petId")
  WHERE "petId" IS NOT NULL AND "deletedAt" IS NULL;

-- Para RAÇA
CREATE UNIQUE INDEX IF NOT EXISTS uq_tprecos_servico_cond_raca
  ON tabela_de_precos ("servicoId","condicaoDePagamentoId","racaId")
  WHERE "racaId" IS NOT NULL AND "deletedAt" IS NULL;

-- Índices de apoio às consultas
CREATE INDEX IF NOT EXISTS idx_tprecos_pet_servico_ativos
  ON tabela_de_precos ("petId","servicoId")
  WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS idx_tprecos_raca_servico_ativos
  ON tabela_de_precos ("racaId","servicoId")
  WHERE "deletedAt" IS NULL;

-- ---------------------------
-- TABELA: movimentos
-- ---------------------------

-- Regra do meio de pagamento:
-- 1 = obrigatório; 3 = opcional; outros = deve ser NULL
ALTER TABLE movimentos
  DROP CONSTRAINT IF EXISTS chk_meio_pagto_condicao;

ALTER TABLE movimentos
  ADD CONSTRAINT chk_meio_pagto_condicao
  CHECK (
    ("condicaoPagamentoId" = 1 AND "meioPagamentoId" IS NOT NULL) OR
    ("condicaoPagamentoId" = 3) OR
    ("condicaoPagamentoId" NOT IN (1,3) AND "meioPagamentoId" IS NULL)
  ) NOT VALID;

-- Valor positivo
ALTER TABLE movimentos
  DROP CONSTRAINT IF EXISTS chk_mov_valor_pos;

ALTER TABLE movimentos
  ADD CONSTRAINT chk_mov_valor_pos
  CHECK ("valor" > 0) NOT VALID;

-- Datas básicas (não trava inserts legado porque é NOT VALID)
ALTER TABLE movimentos
  DROP CONSTRAINT IF EXISTS chk_mov_datas_basicas;

ALTER TABLE movimentos
  ADD CONSTRAINT chk_mov_datas_basicas
  CHECK (
    ("data_vencimento" IS NULL OR "data_lancamento" IS NULL OR "data_vencimento" >= "data_lancamento")
    AND
    ("data_liquidacao" IS NULL OR "data_movimento" IS NULL OR "data_liquidacao" >= "data_movimento")
  ) NOT VALID;

-- Índices de apoio às consultas
CREATE INDEX IF NOT EXISTS idx_movimentos_periodo
  ON movimentos ("data_lancamento","id")
  WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS idx_movimentos_pet_servico
  ON movimentos ("petId","servicoId")
  WHERE "deletedAt" IS NULL;

COMMIT;

-- ============================================
-- OPCIONAL: Validar os CHECKs quando a base estiver redonda
-- (descomente quando quiser forçar validação dos registros existentes)
-- ALTER TABLE tabela_de_precos VALIDATE CONSTRAINT chk_pet_xor_raca;
-- ALTER TABLE tabela_de_precos VALIDATE CONSTRAINT chk_preco_valor_pos;
-- ALTER TABLE movimentos VALIDATE CONSTRAINT chk_meio_pagto_condicao;
-- ALTER TABLE movimentos VALIDATE CONSTRAINT chk_mov_valor_pos;
-- ALTER TABLE movimentos VALIDATE CONSTRAINT chk_mov_datas_basicas;
-- ============================================

-- ============================================
-- DICAS RÁPIDAS (se algo falhar por duplicidade/violação)
-- 1) Ver duplicatas na tabela de preços (PET):
--    SELECT "servicoId","condicaoDePagamentoId","petId", COUNT(*)
--    FROM tabela_de_precos
--    WHERE "petId" IS NOT NULL AND "deletedAt" IS NULL
--    GROUP BY 1,2,3 HAVING COUNT(*) > 1;

-- 2) Ver duplicatas na tabela de preços (RAÇA):
--    SELECT "servicoId","condicaoDePagamentoId","racaId", COUNT(*)
--    FROM tabela_de_precos
--    WHERE "racaId" IS NOT NULL AND "deletedAt" IS NULL
--    GROUP BY 1,2,3 HAVING COUNT(*) > 1;

-- 3) Ver quebras de regra do meio de pagamento:
--    -- À vista sem meio:
--    SELECT id,"condicaoPagamentoId","meioPagamentoId"
--    FROM movimentos WHERE "condicaoPagamentoId" = 1 AND "meioPagamentoId" IS NULL;
--    -- Outros (≠1 e ≠3) com meio:
--    SELECT id,"condicaoPagamentoId","meioPagamentoId"
--    FROM movimentos WHERE "condicaoPagamentoId" NOT IN (1,3) AND "meioPagamentoId" IS NOT NULL;
-- ============================================
