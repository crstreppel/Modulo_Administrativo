// backend/modules/fornecedores/fornecedorController.js
// =============================================================
// 📦 Módulo: Fornecedores
// 🧱 Padrão: PBQE-C™ v2.6.3 — Controle Fiscal & Segurança CNPJ™
// 🔧 Responsáveis: Claudião (arquitetura) & Bruxão (execução)
// =============================================================

const Fornecedor = require('./fornecedorModel');

// -------------------------------------------------------------
// 🔍 Listar todos os fornecedores
// -------------------------------------------------------------
const listar = async (req, res) => {
  try {
    const fornecedores = await Fornecedor.findAll();
    res.status(200).json(fornecedores);
  } catch (error) {
    console.error('💥 [PBQE-C] Erro ao listar fornecedores:', error);
    res.status(500).json({
      mensagem: 'Erro ao listar fornecedores',
      erro: error.message,
      detalhes: error.stack
    });
  }
};

// -------------------------------------------------------------
// 🔎 Buscar fornecedor por ID
// -------------------------------------------------------------
const buscarPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const fornecedor = await Fornecedor.findByPk(id);

    if (!fornecedor)
      return res.status(404).json({ mensagem: 'Fornecedor não encontrado' });

    res.status(200).json(fornecedor);
  } catch (error) {
    console.error('💥 [PBQE-C] Erro ao buscar fornecedor:', error);
    res.status(500).json({
      mensagem: 'Erro ao buscar fornecedor',
      erro: error.message,
      detalhes: error.stack
    });
  }
};

// -------------------------------------------------------------
// 🏗️ Criar novo fornecedor
// -------------------------------------------------------------
const criar = async (req, res) => {
  try {
    const { tipoPessoa, razaoSocial, cpfCnpj, tipoFornecedor } = req.body;

    if (!tipoPessoa || !razaoSocial || !cpfCnpj || !tipoFornecedor) {
      return res.status(400).json({
        mensagem:
          'Campos obrigatórios: tipoPessoa, razaoSocial, cpfCnpj, tipoFornecedor'
      });
    }

    console.log('🧩 [PBQE-C] Recebendo dados para criação de fornecedor:', req.body);

    const novoFornecedor = await Fornecedor.create(req.body);

    console.log('✅ [PBQE-C] Fornecedor criado com sucesso:', novoFornecedor.id);
    res.status(201).json(novoFornecedor);
  } catch (error) {
    console.error('💥 [PBQE-C] Erro interno ao criar fornecedor:', error);
    res.status(500).json({
      mensagem: 'Erro ao criar fornecedor',
      erro: error.message,
      detalhes: error.stack
    });
  }
};

// -------------------------------------------------------------
// 🔄 Atualizar fornecedor existente
// -------------------------------------------------------------
const atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const dados = req.body;
    const fornecedor = await Fornecedor.findByPk(id);

    if (!fornecedor)
      return res.status(404).json({ mensagem: 'Fornecedor não encontrado' });

    // 🚫 Bloquear alteração de CNPJ (imutabilidade fiscal)
    if (dados.cpfCnpj && dados.cpfCnpj !== fornecedor.cpfCnpj) {
      console.warn(`⚠️ [PBQE-C] Tentativa de alteração de CNPJ detectada (Fornecedor ID ${id})`);
      return res.status(400).json({
        mensagem:
          'Alteração de CNPJ não permitida. Crie um novo fornecedor e vincule ao atual.',
        fornecedorId: id
      });
    }

    console.log(`🛠️ [PBQE-C] Atualizando fornecedor ID ${id}...`);
    await fornecedor.update(dados);

    res.status(200).json({
      mensagem: 'Fornecedor atualizado com sucesso',
      fornecedor
    });
  } catch (error) {
    console.error('💥 [PBQE-C] Erro ao atualizar fornecedor:', error);
    res.status(500).json({
      mensagem: 'Erro ao atualizar fornecedor',
      erro: error.message,
      detalhes: error.stack
    });
  }
};

// -------------------------------------------------------------
// ❌ Excluir fornecedor (soft delete)
// -------------------------------------------------------------
const excluir = async (req, res) => {
  try {
    const { id } = req.params;
    const fornecedor = await Fornecedor.findByPk(id);

    if (!fornecedor)
      return res.status(404).json({ mensagem: 'Fornecedor não encontrado' });

    console.log(`🗑️ [PBQE-C] Excluindo fornecedor ID ${id}...`);
    await fornecedor.destroy();

    res.status(200).json({
      mensagem: 'Fornecedor excluído com sucesso (soft delete)'
    });
  } catch (error) {
    console.error('💥 [PBQE-C] Erro ao excluir fornecedor:', error);
    res.status(500).json({
      mensagem: 'Erro ao excluir fornecedor',
      erro: error.message,
      detalhes: error.stack
    });
  }
};

module.exports = { listar, buscarPorId, criar, atualizar, excluir };
