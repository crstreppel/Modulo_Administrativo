const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname);
let erroDetectado = false;

function verificarArquivos(dir) {
  const arquivos = fs.readdirSync(dir);

  arquivos.forEach((arquivo) => {
    const caminho = path.join(dir, arquivo);
    const stat = fs.statSync(caminho);

    if (stat.isDirectory()) {
      verificarArquivos(caminho);
    } else if (arquivo.endsWith('.js')) {
      const conteudo = fs.readFileSync(caminho, 'utf8');
      if (conteudo.includes('document.') || conteudo.includes('window.')) {
        console.log(`🚨 FRONTEND DETECTADO no backend: ${caminho}`);
        erroDetectado = true;
      }
    }
  });
}

verificarArquivos(backendDir);

if (erroDetectado) {
  console.error('\n❌ Erro: Código de frontend encontrado no backend!\n');
  process.exit(1);
} else {
  console.log('✅ Backend limpo. Nenhum código de frontend detectado.');
}
