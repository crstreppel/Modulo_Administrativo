// =============================================================
// 🧙‍♂️ Seed Fornecedores • PBQE-C™ v2.6.4
// -------------------------------------------------------------
// Executa com: `node seeders/seedFornecedores.js`
// Gera 1000 fornecedores sintéticos (teste de carga e rastreabilidade)
// Padrão: Bruxão V1 + Logs PBQE-C
// =============================================================

const { sequelize } = require('../config/db');
const Fornecedor = require('../modules/fornecedores/fornecedorModel');

async function run() {
  try {
    console.log('🔌 [PBQE-C] Conectando ao banco...');
    await sequelize.authenticate();
    console.log('✅ [PBQE-C] Conexão estabelecida com sucesso.\n');

    const totalRegistros = 1000;
    const fornecedores = [];
    const tiposPessoa = ['F', 'J'];
    const tiposFornecedor = ['Produto', 'Serviço', 'Ambos'];

    console.log(`🧮 [PBQE-C] Iniciando geração de ${totalRegistros} fornecedores sintéticos...\n`);

    for (let i = 1; i <= totalRegistros; i++) {
      const tipoPessoa = tiposPessoa[Math.floor(Math.random() * tiposPessoa.length)];
      const tipoFornecedor = tiposFornecedor[Math.floor(Math.random() * tiposFornecedor.length)];

      fornecedores.push({
        tipoPessoa,
        razaoSocial: `Fornecedor ${i}`,
        nomeFantasia: `Fantasia ${i}`,
        cpfCnpj: `${Math.floor(10000000000 + Math.random() * 90000000000)}`,
        inscricaoEstadual: `IS-${i}`,
        emailPrincipal: `fornecedor${i}@teste.com`,
        telefonePrincipal: `5199${Math.floor(10000000 + Math.random() * 89999999)}`,
        tipoFornecedor,
        scoreAtual: (Math.random() * 100).toFixed(2),
        ativo: true,
        observacoes: `Fornecedor sintético gerado automaticamente para testes PBQE-C.`,
        statusId: 1, // padrão ativo
      });
    }

    console.log('📦 [PBQE-C] Inserindo registros no banco...');
    await Fornecedor.bulkCreate(fornecedores, { validate: true });

    console.log(`\n✅ [PBQE-C] ${totalRegistros} fornecedores criados com sucesso!`);
    console.log('🏁 [PBQE-C] Seed concluído — Sistema pronto para testes e carga inicial.');
  } catch (err) {
    console.error('💥 [PBQE-C] Erro no seed de fornecedores:', err);
    throw err;
  } finally {
    await sequelize.close();
    console.log('\n🔒 [PBQE-C] Conexão encerrada com segurança.\n');
  }
}

// Só executa se rodar diretamente via terminal
if (require.main === module) {
  run().catch(() => process.exit(1));
}

module.exports = { run };
