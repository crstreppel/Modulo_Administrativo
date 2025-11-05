// backend/modules/fornecedores/submodules/fornecedorContatos/fornecedorContatosController.js
// =============================================================
// 📦 Submódulo: FornecedorContatos
// 🧱 Padrão: PBQE-C™ v2.6.3 — Hierarquia Integrada & Logs Padronizados
// 🔧 Responsáveis: Claudião (arquitetura) & Bruxão (execução)
// =============================================================
//
// 🧩 Função:
// CRUD completo de contatos vinculados a fornecedores,
// com validações e soft delete, seguindo o padrão Bruxônico.
// =============================================================

const FornecedorContato = require('./fornecedorContatosModel');
const Fornecedor = require('../../fornecedorModel');
const Status = require('../../../../models/Status');

// -------------------------------------------------------------
// 🏗️ Criar novo contato de fornecedor
// -------------------------------------------------------------
const criar = async (req, res) => {
  try {
    const { fornecedorId, nome, telefone, email, cargo, observacoes, statusId } = req.body;

    if (!fornecedorId || !nome) {
      return res.status(400).json({
        mensagem: 'Campos obrigatórios: fornecedorId e nome.'
      });
    }

    // 🧠 Valida existência do fornecedor
    const fornecedor = await Fornecedor.findByPk(fornecedorId);
    if (!fornecedor) {
      return res.status(404).json({
        mensagem: `Fornecedor ID ${fornecedorId} não encontrado.`
      });
    }

    const novoContato = await FornecedorContato.create({
      fornecedorId, nome, telefone, email, cargo, observacoes, statusId
    });

    console.log(`✅ [PBQE-C] Contato criado (Fornecedor ID ${fornecedorId})`);
    return res.status(201).json(novoContato);

  } catch (error) {
    console.error('💥 [PBQE-C] Erro ao criar contato de fornecedor:', error);
    return res.status(500).json({
      mensagem: 'Erro interno ao criar contato.',
      erro: error.message
    });
  }
};

// -------------------------------------------------------------
// 🔍 Listar todos os contatos
// -------------------------------------------------------------
const listar = async (req, res) => {
  try {
    const contatos = await FornecedorContato.findAll({
      include: [
        { model: Fornecedor, attributes: ['id', 'razaoSocial', 'nomeFantasia'] },
        { model: Status, attributes: ['descricao'] }
      ],
      order: [['id', 'ASC']]
    });

    console.log(`📋 [PBQE-C] ${contatos.length} contatos retornados.`);
    return res.status(200).json(contatos);

  } catch (error) {
    console.error('💥 [PBQE-C] Erro ao listar contatos:', error);
    return res.status(500).json({
      mensagem: 'Erro interno ao listar contatos.',
      erro: error.message
    });
  }
};

// -------------------------------------------------------------
// 🔄 Atualizar contato existente
// -------------------------------------------------------------
const atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const dados = req.body;
    const contato = await FornecedorContato.findByPk(id);

    if (!contato) {
      return res.status(404).json({ mensagem: 'Contato não encontrado.' });
    }

    await contato.update(dados);
    console.log(`🛠️ [PBQE-C] Contato ID ${id} atualizado.`);
    return res.status(200).json(contato);

  } catch (error) {
    console.error('💥 [PBQE-C] Erro ao atualizar contato:', error);
    return res.status(500).json({
      mensagem: 'Erro interno ao atualizar contato.',
      erro: error.message
    });
  }
};

// -------------------------------------------------------------
// ❌ Excluir contato (soft delete)
// -------------------------------------------------------------
const excluir = async (req, res) => {
  try {
    const { id } = req.params;
    const contato = await FornecedorContato.findByPk(id);

    if (!contato) {
      return res.status(404).json({ mensagem: 'Contato não encontrado.' });
    }

    await contato.destroy();
    console.log(`🗑️ [PBQE-C] Contato ID ${id} excluído (soft delete).`);
    return res.status(200).json({ mensagem: 'Contato excluído com sucesso.' });

  } catch (error) {
    console.error('💥 [PBQE-C] Erro ao excluir contato:', error);
    return res.status(500).json({
      mensagem: 'Erro interno ao excluir contato.',
      erro: error.message
    });
  }
};

module.exports = { criar, listar, atualizar, excluir };
