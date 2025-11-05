// backend/modules/fornecedores/fornecedorAssociations.js
// =============================================================
// 📦 Módulo: Fornecedores
// 🧱 Padrão: PBQE-C™ v2.6.3 — Autorrelacionamento & Estrutura Integrada
// 🔧 Responsáveis: Claudião (arquitetura) & Bruxão (execução)
// =============================================================
//
// 🧩 Função:
// Centraliza todas as associações internas do módulo Fornecedores
// (matriz/filiais, substituição fiscal e submódulos).
//
// ⚙️ Regras PBQE-C™ v2.6+
// - Cada módulo possui seu próprio associations.js.
// - Submódulos se conectam apenas ao módulo-pai via require explícito.
// - Nenhum require cruzado entre módulos.
// =============================================================

const Fornecedor = require('./fornecedorModel');
const Status = require('../../models/Status');

// Submódulos — (serão plugados conforme forem implementados)
let FornecedorContatos;
let FornecedorEnderecos;
let FornecedorDadosBancarios;
let FornecedorAnexos;
let FornecedorAvaliacoes;

try {
  FornecedorContatos = require('./submodules/fornecedorContatos/fornecedorContatosModel');
  FornecedorEnderecos = require('./submodules/fornecedorEnderecos/fornecedorEnderecosModel');
  FornecedorDadosBancarios = require('./submodules/fornecedorDadosBancarios/fornecedorDadosBancariosModel');
  FornecedorAnexos = require('./submodules/fornecedorAnexos/fornecedorAnexosModel');
  FornecedorAvaliacoes = require('./submodules/fornecedorAvaliacoes/fornecedorAvaliacoesModel');
} catch {
  console.log('⚠️ [PBQE-C] Alguns submódulos de fornecedores ainda não foram implementados.');
}

// =============================================================
// 🔗 Função principal — aplicar associações
// =============================================================
const aplicarAssociacoesFornecedor = () => {
  // -----------------------------------------------------------
  // 🧱 Autorrelacionamento: matriz ↔ filiais
  // -----------------------------------------------------------
  Fornecedor.belongsTo(Fornecedor, {
    as: 'Matriz',
    foreignKey: 'matrizId'
  });
  Fornecedor.hasMany(Fornecedor, {
    as: 'Filiais',
    foreignKey: 'matrizId'
  });

  // -----------------------------------------------------------
  // 🧾 Substituição fiscal (novo fornecedor substitui anterior)
  // -----------------------------------------------------------
  Fornecedor.belongsTo(Fornecedor, {
    as: 'Substitui',
    foreignKey: 'substituiFornecedorId'
  });
  Fornecedor.hasMany(Fornecedor, {
    as: 'SubstituidoPor',
    foreignKey: 'substituiFornecedorId'
  });

  // -----------------------------------------------------------
  // ⚙️ Status
  // -----------------------------------------------------------
  Status.hasMany(Fornecedor, { foreignKey: 'statusId' });
  Fornecedor.belongsTo(Status, { foreignKey: 'statusId' });

  // -----------------------------------------------------------
  // 📞 Contatos
  // -----------------------------------------------------------
  if (FornecedorContatos) {
    Fornecedor.hasMany(FornecedorContatos, {
      foreignKey: 'fornecedorId',
      as: 'contatos'
    });
    FornecedorContatos.belongsTo(Fornecedor, {
      foreignKey: 'fornecedorId',
      as: 'fornecedor'
    });
  }

  // -----------------------------------------------------------
  // 🏠 Endereços
  // -----------------------------------------------------------
  if (FornecedorEnderecos) {
    Fornecedor.hasMany(FornecedorEnderecos, {
      foreignKey: 'fornecedorId',
      as: 'enderecos'
    });
    FornecedorEnderecos.belongsTo(Fornecedor, {
      foreignKey: 'fornecedorId',
      as: 'fornecedor'
    });
  }

  // -----------------------------------------------------------
  // 🏦 Dados bancários
  // -----------------------------------------------------------
  if (FornecedorDadosBancarios) {
    Fornecedor.hasMany(FornecedorDadosBancarios, {
      foreignKey: 'fornecedorId',
      as: 'dadosBancarios'
    });
    FornecedorDadosBancarios.belongsTo(Fornecedor, {
      foreignKey: 'fornecedorId',
      as: 'fornecedor'
    });
  }

  // -----------------------------------------------------------
  // 📎 Anexos
  // -----------------------------------------------------------
  if (FornecedorAnexos) {
    Fornecedor.hasMany(FornecedorAnexos, {
      foreignKey: 'fornecedorId',
      as: 'anexos'
    });
    FornecedorAnexos.belongsTo(Fornecedor, {
      foreignKey: 'fornecedorId',
      as: 'fornecedor'
    });
  }

  // -----------------------------------------------------------
  // ⭐ Avaliações
  // -----------------------------------------------------------
  if (FornecedorAvaliacoes) {
    Fornecedor.hasMany(FornecedorAvaliacoes, {
      foreignKey: 'fornecedorId',
      as: 'avaliacoes'
    });
    FornecedorAvaliacoes.belongsTo(Fornecedor, {
      foreignKey: 'fornecedorId',
      as: 'fornecedor'
    });
  }

  console.log('🔗 [PBQE-C v2.6.3] Associações do módulo Fornecedores aplicadas com sucesso.');
};

module.exports = { aplicarAssociacoesFornecedor };
