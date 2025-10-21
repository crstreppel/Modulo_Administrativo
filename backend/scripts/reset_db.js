from datetime import datetime

# Conteúdo do script SQL com comentário na parte da tabela "logs"
sql_content = f"""-- 🧙‍♂️✨ MODO CLAUDIÃO BOCA BRABA v2.0
-- Purificação completa da base petropolitan_pro
-- Zerando movimentos, contas a receber, adiantamentos e auditoria
-- Padrão Bruxão de Excelência
-- Gerado automaticamente em {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

BEGIN;

-- Desativa restrições temporárias
SET session_replication_role = replica;

-- 🚿 Limpeza principal
TRUNCATE TABLE public."movimentos" RESTART IDENTITY CASCADE;
TRUNCATE TABLE public."contas_a_receber" RESTART IDENTITY CASCADE;
TRUNCATE TABLE public."controle_adiantamentos" RESTART IDENTITY CASCADE;

-- 🧾 Limpeza de logs e auditorias
-- TRUNCATE TABLE public."logs" RESTART IDENTITY CASCADE;  -- (View ainda não existente)
TRUNCATE TABLE public."auditorias" RESTART IDENTITY CASCADE;

-- Reativa as restrições
SET session_replication_role = DEFAULT;

COMMIT;

-- 🪄 Relatório simbólico
-- Tudo limpo, tudo zerado, IDs resetados.
-- Base pronta pra pancadaria controlada do Claudião Boca Braba.
-- 🧙‍♂️⚡ “Que o Sequelize chore, mas não quebre!”
"""

# Caminho do arquivo
file_path = "/mnt/data/script_purificacao_geral_pro.sql"

# Criação do arquivo
with open(file_path, "w", encoding="utf-8") as f:
    f.write(sql_content)

file_path
