/* =============================================================
 * create_cancelar_via_ajuste.js • v2.0 — Cirurgia Tripla Bruxão™
 * -------------------------------------------------------------
 * - Cancela movimento original ao detectar reverso (status = 8)
 * - Atualiza título e adiantamento vinculados
 * - Mantém auditoria via observação no movimento original
 * - Compatível com V1 (status textual em adiantamentos)
 * -------------------------------------------------------------
*/

const { sequelize } = require('../../config/db');

async function createCancelarViaAjuste() {
  console.log('⚙️ Criando função fn_cancelar_movimento_via_ajuste() v2.0...');

  const sql = `
    DROP TRIGGER IF EXISTS trg_cancelar_movimento_via_ajuste ON public.movimentos;
    DROP FUNCTION IF EXISTS public.fn_cancelar_movimento_via_ajuste();

    CREATE FUNCTION public.fn_cancelar_movimento_via_ajuste()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    DECLARE
      v_id_original INTEGER;
      v_texto TEXT;
      v_adi_id INTEGER;
    BEGIN
      -- Atua apenas em movimentos com status AJUSTE (8)
      IF NEW."statusId" <> 8 THEN
        RETURN NEW;
      END IF;

      -- Extrai o número do movimento original da observação (ex: "#227")
      v_texto := NEW.observacao;
      v_id_original := NULL;

      IF v_texto ~ '#[0-9]+' THEN
        v_id_original := (regexp_matches(v_texto, '#([0-9]+)'))[1]::INTEGER;
      END IF;

      -- Se não achou id original, apenas ignora
      IF v_id_original IS NULL THEN
        RAISE NOTICE '⚠️ Nenhum movimento original identificado no ajuste %.', NEW.id;
        RETURN NEW;
      END IF;

      -- Evita recursão infinita
      IF v_id_original = NEW.id THEN
        RETURN NEW;
      END IF;

      -- Atualiza o movimento original para CANCELADO
      UPDATE public.movimentos
         SET "statusId" = 7,
             "updatedAt" = NOW(),
             "observacao" = COALESCE("observacao",'') ||
               ' | Cancelado automaticamente via ajuste #' || NEW.id
       WHERE id = v_id_original
         AND "statusId" <> 7;

      RAISE NOTICE '🧨 Movimento % cancelado via ajuste %.', v_id_original, NEW.id;

      -- Cancela o título vinculado, se existir
      UPDATE public.contas_a_receber
         SET "statusId" = 7,
             "updatedAt" = NOW()
       WHERE "movimentoId" = v_id_original
         AND "statusId" <> 7;

      RAISE NOTICE '💰 Título vinculado ao movimento % marcado como CANCELADO.', v_id_original;

      -- Localiza o adiantamento vinculado (se houver) e o zera
      SELECT "adiantamentoId"
        INTO v_adi_id
        FROM public.movimentos
       WHERE id = v_id_original
         AND "adiantamentoId" IS NOT NULL
       LIMIT 1;

      IF v_adi_id IS NOT NULL THEN
        UPDATE public.adiantamentos
           SET "saldoAtual" = 0,
               "status" = 'cancelado',
               "updatedAt" = NOW()
         WHERE id = v_adi_id
           AND "status" <> 'cancelado';

        RAISE NOTICE '💸 Adiantamento % vinculado ao movimento % zerado e cancelado.', v_adi_id, v_id_original;
      END IF;

      RETURN NEW;
    END;
    $$;

    CREATE TRIGGER trg_cancelar_movimento_via_ajuste
    AFTER INSERT ON public.movimentos
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_cancelar_movimento_via_ajuste();
  `;

  await sequelize.query(sql);
  console.log('✅ Função fn_cancelar_movimento_via_ajuste() v2.0 criada com sucesso.');
}

module.exports = { createCancelarViaAjuste };
