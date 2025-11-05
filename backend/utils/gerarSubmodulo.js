/* =============================================================
 * 🧙‍♂️ PBQE-C Generator v2.6.1™ - Modo Autoadaptativo
 * -------------------------------------------------------------
 * Bruxão Autocoder — Criador Automático de Submódulos Inteligente
 * -------------------------------------------------------------
 * - Cria pasta e arquivos backend do submódulo
 * - Adiciona campos específicos conforme o tipo detectado
 * -------------------------------------------------------------
 * Uso:
 *   node backend/utils/gerarSubmodulo.js fornecedorEnderecos
 * ============================================================= */

const fs = require("fs");
const path = require("path");

// ===== Banner Bruxônico =====
console.log(`
=============================================================
✨ PBQE-C v2.6.1 - Bruxão Autocoder 🧠 Modo Autoadaptativo
🚀 Gerador inteligente de submódulos backend
=============================================================
`);

const nome = process.argv[2];
if (!nome) {
  console.error("❌ Informe o nome do submódulo. Exemplo:\n   node backend/utils/gerarSubmodulo.js fornecedorEnderecos");
  process.exit(1);
}

// =============================================================
// 🧠 Funções utilitárias
// =============================================================
function capitalizar(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function gerarTabela(str) {
  return str.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
}

const Nome = capitalizar(nome);
const tabela = gerarTabela(nome);

// Caminho base
const basePath = path.join(__dirname, "../modules/fornecedores/submodules", nome);
fs.mkdirSync(basePath, { recursive: true });

// =============================================================
// 💡 Template dinâmico conforme o tipo de submódulo
// =============================================================
let camposExtras = ``;

if (nome.toLowerCase().includes("endereco")) {
  camposExtras = `
  logradouro: { type: DataTypes.STRING(150), allowNull: false },
  numero: { type: DataTypes.STRING(10), allowNull: true },
  complemento: { type: DataTypes.STRING(60), allowNull: true },
  bairro: { type: DataTypes.STRING(100), allowNull: true },
  cidade: { type: DataTypes.STRING(100), allowNull: false },
  estado: { type: DataTypes.CHAR(2), allowNull: false },
  cep: { type: DataTypes.STRING(10), allowNull: true },
  tipoEndereco: { type: DataTypes.STRING(30), allowNull: true }, // ex: residencial, comercial, entrega
  referencia: { type: DataTypes.STRING(150), allowNull: true }, // ponto de referência, condomínio, torre, etc.
  observacoes: { type: DataTypes.TEXT, allowNull: true },
  `;
} else if (nome.toLowerCase().includes("contato")) {
  camposExtras = `
  nome: { type: DataTypes.STRING(100), allowNull: false },
  telefone: { type: DataTypes.STRING(20), allowNull: true },
  email: { type: DataTypes.STRING(100), allowNull: true },
  cargo: { type: DataTypes.STRING(60), allowNull: true },
  observacoes: { type: DataTypes.TEXT, allowNull: true },
  `;
} else if (nome.toLowerCase().includes("dadosbancario")) {
  camposExtras = `
  banco: { type: DataTypes.STRING(100), allowNull: false },
  agencia: { type: DataTypes.STRING(20), allowNull: true },
  conta: { type: DataTypes.STRING(20), allowNull: true },
  pix: { type: DataTypes.STRING(150), allowNull: true },
  tipoConta: { type: DataTypes.STRING(20), allowNull: true },
  observacoes: { type: DataTypes.TEXT, allowNull: true },
  `;
} else if (nome.toLowerCase().includes("avaliacao")) {
  camposExtras = `
  nota: { type: DataTypes.INTEGER, allowNull: false },
  comentario: { type: DataTypes.TEXT, allowNull: true },
  dataAvaliacao: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  `;
} else if (nome.toLowerCase().includes("anexo")) {
  camposExtras = `
  nomeArquivo: { type: DataTypes.STRING(150), allowNull: false },
  caminhoArquivo: { type: DataTypes.STRING(255), allowNull: false },
  tipoArquivo: { type: DataTypes.STRING(50), allowNull: true },
  descricao: { type: DataTypes.TEXT, allowNull: true },
  `;
} else if (nome.toLowerCase().includes("categoria")) {
  camposExtras = `
  descricao: { type: DataTypes.STRING(100), allowNull: false },
  observacoes: { type: DataTypes.TEXT, allowNull: true },
  `;
}

// =============================================================
// ✍️ Templates PBQE-C v2.6.1
// =============================================================

// === Model ===
const modelTemplate = `/* =============================================================
 * Model: ${nome}Model.js
 * -------------------------------------------------------------
 * Gerado automaticamente pelo PBQE-C Generator v2.6.1
 * ============================================================= */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../../config/db'); // ajuste fixo

const ${Nome} = sequelize.define('${Nome}', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  fornecedorId: { type: DataTypes.INTEGER, allowNull: false },
  ${camposExtras}
  statusId: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  deletedAt: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: '${tabela}',
  paranoid: true,
  timestamps: true
});

module.exports = ${Nome};
`;

// === Controller ===
const controllerTemplate = `/* =============================================================
 * Controller: ${nome}Controller.js
 * -------------------------------------------------------------
 * Gerado automaticamente pelo PBQE-C Generator v2.6.1
 * ============================================================= */
const ${Nome} = require('./${nome}Model');
const Fornecedor = require('../../fornecedorModel');
const Status = require('../../../../models/Status');

module.exports = {
  async criar(req, res) {
    try {
      const dados = req.body;
      if (!dados.fornecedorId) {
        return res.status(400).json({ erro: 'Campo fornecedorId é obrigatório.' });
      }
      const novo = await ${Nome}.create(dados);
      return res.status(201).json(novo);
    } catch (error) {
      console.error('Erro ao criar ${nome}:', error);
      return res.status(500).json({ erro: 'Erro interno ao criar registro.' });
    }
  },

  async listar(req, res) {
    try {
      const registros = await ${Nome}.findAll({
        include: [
          { model: Fornecedor, attributes: ['id', 'razaoSocial', 'nomeFantasia'] },
          { model: Status, attributes: ['id', 'descricao'] }
        ],
        order: [['id', 'ASC']]
      });
      return res.status(200).json(registros);
    } catch (error) {
      console.error('Erro ao listar ${nome}:', error);
      return res.status(500).json({ erro: 'Erro interno ao listar registros.' });
    }
  },

  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const dados = req.body;
      const registro = await ${Nome}.findByPk(id);
      if (!registro) return res.status(404).json({ erro: '${Nome} não encontrado.' });
      await registro.update(dados);
      return res.status(200).json(registro);
    } catch (error) {
      console.error('Erro ao atualizar ${nome}:', error);
      return res.status(500).json({ erro: 'Erro interno ao atualizar registro.' });
    }
  },

  async excluir(req, res) {
    try {
      const { id } = req.params;
      const registro = await ${Nome}.findByPk(id);
      if (!registro) return res.status(404).json({ erro: '${Nome} não encontrado.' });
      await registro.destroy();
      return res.status(200).json({ mensagem: '${Nome} excluído com sucesso.' });
    } catch (error) {
      console.error('Erro ao excluir ${nome}:', error);
      return res.status(500).json({ erro: 'Erro interno ao excluir registro.' });
    }
  }
};
`;

// === Routes ===
const routesTemplate = `/* =============================================================
 * Routes: ${nome}Routes.js
 * -------------------------------------------------------------
 * Gerado automaticamente pelo PBQE-C Generator v2.6.1
 * ============================================================= */
const express = require('express');
const router = express.Router();
const controller = require('./${nome}Controller');

router.post('/', controller.criar);
router.get('/', controller.listar);
router.put('/:id', controller.atualizar);
router.delete('/:id', controller.excluir);

module.exports = router;
`;

// === Associations ===
const associationsTemplate = `/* =============================================================
 * Associations: ${nome}Associations.js
 * -------------------------------------------------------------
 * Gerado automaticamente pelo PBQE-C Generator v2.6.1
 * ============================================================= */
const ${Nome} = require('./${nome}Model');
const Fornecedor = require('../../fornecedorModel');
const Status = require('../../../../models/Status');

Fornecedor.hasMany(${Nome}, { foreignKey: 'fornecedorId' });
${Nome}.belongsTo(Fornecedor, { foreignKey: 'fornecedorId' });

Status.hasMany(${Nome}, { foreignKey: 'statusId' });
${Nome}.belongsTo(Status, { foreignKey: 'statusId' });

module.exports = { ${Nome} };
`;

// =============================================================
// 🧩 Criação dos arquivos
// =============================================================
function criarArquivo(nomeArquivo, conteudo) {
  const destino = path.join(basePath, nomeArquivo);
  fs.writeFileSync(destino, conteudo);
  console.log(`✅ ${nomeArquivo} criado com sucesso.`);
}

criarArquivo(`${nome}Model.js`, modelTemplate);
criarArquivo(`${nome}Controller.js`, controllerTemplate);
criarArquivo(`${nome}Routes.js`, routesTemplate);
criarArquivo(`${nome}Associations.js`, associationsTemplate);

console.log(`
=============================================================
✨ Submódulo "${nome}" criado com sucesso!
📁 Local: ${basePath}
🧙‍♂️ Gerado automaticamente com inteligência PBQE-C v2.6.1
=============================================================
`);
