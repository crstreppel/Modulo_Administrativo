const express = require('express');
const cors = require('cors');

const { sequelize } = require('./config/db'); // pega direto do config/db.js

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
app.use('/api/contas-a-receber', contasAReceberRoutes); // Corrigida a rota, typo arrumado

// Inicializa servidor
const PORT = 3000;

app.listen(PORT, async () => {
  try {
    await sequelize.sync({ force: false, logging: false });

    // Executa verificação e (re)criação da trigger
    await sequelize.query(`
      DO $$
      DECLARE
        v_table_exists BOOLEAN;
        v_func_exists BOOLEAN;
        v_trigger_exists BOOLEAN;
      BEGIN
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'movimentos'
        ) INTO v_table_exists;

        SELECT EXISTS (
          SELECT 1 FROM pg_proc WHERE proname = 'fn_gerenciar_adiantamento'
        ) INTO v_func_exists;

        IF v_table_exists THEN
          IF v_func_exists THEN
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
    `);

    console.log(`🔥 Servidor rodando em http://localhost:${PORT}`);
  } catch (error) {
    console.error('❌ Erro ao sincronizar com o banco:', error);
  }
});
