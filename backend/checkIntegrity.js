const path = require('path');
const fs = require('fs');
const { sequelize } = require('./config/db');

async function checarIntegridade() {
  try {
    // 1 - Testa conexão com o banco
    await sequelize.authenticate();
    console.log('✅ Banco conectado com sucesso.');

    // 2 - Checa controllers
    const controllersDir = path.join(__dirname, 'controllers');
    const controllersArquivos = fs.readdirSync(controllersDir).filter(f => f.endsWith('.js'));

    let erros = 0;

    for (const arquivo of controllersArquivos) {
      const controller = require(path.join(controllersDir, arquivo));
      // Aqui você pode definir funções que espera no controller
      // Exemplo: listarPets, criarPet, atualizarPet, deletarPet
      const funcoesEsperadas = ['listarPets', 'criarPet', 'atualizarPet', 'deletarPet'];

      funcoesEsperadas.forEach(fn => {
        if (typeof controller[fn] !== 'function') {
          console.error(`❌ Controller ${arquivo} NÃO TEM a função esperada: ${fn}`);
          erros++;
        }
      });
    }

    if (erros === 0) {
      console.log('✅ Todos os controllers passaram no teste.');
    } else {
      throw new Error(`${erros} erro(s) encontrado(s) nos controllers.`);
    }

    // Se quiser mais checagens, adiciona aqui...

    console.log('🎯 Checagem de integridade concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('🔥 Falha na checagem de integridade:', error.message);
    process.exit(1);
  }
}

checarIntegridade();
