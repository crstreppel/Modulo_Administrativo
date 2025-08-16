const Servicos = require('./Servicos');
const Status = require('./Status');
const Racas = require('./Racas');
const Clientes = require('./Clientes');
const Especie = require('./Especie');
const CondicaoDePagamento = require('./CondicaoDePagamento');
const Meio_de_pagamento = require('./MeioDePagamento');
const Pets = require('./Pets');
const TabelaDePrecos = require('./TabelaDePrecos');
const Movimentos = require('./Movimentos');
const Adiantamentos = require('./Adiantamento');
const ContasAReceber = require('./ContasAReceber');
const CondicaoPagamentoParcelas = require('./CondicaoPagamentoParcelas'); // Importa o model novo


/* ------------------------------------------------------------------
 * RELACIONAMENTOS COM STATUS
 * ----------------------------------------------------------------*/
Servicos.belongsTo(Status, { foreignKey: 'statusId', as: 'status' });
Status.hasMany(Servicos, { foreignKey: 'statusId', as: 'servicos' });

Racas.belongsTo(Status, { foreignKey: 'statusId', as: 'status' });
Status.hasMany(Racas, { foreignKey: 'statusId', as: 'racas' });

Clientes.belongsTo(Status, { foreignKey: 'statusId', as: 'status' });
Status.hasMany(Clientes, { foreignKey: 'statusId', as: 'clientes' });

Especie.belongsTo(Status, { foreignKey: 'statusId', as: 'status' });
Status.hasMany(Especie, { foreignKey: 'statusId', as: 'especies' });

CondicaoDePagamento.belongsTo(Status, { foreignKey: 'statusId', as: 'status' });
Status.hasMany(CondicaoDePagamento, { foreignKey: 'statusId', as: 'condicoesDePagamento' });

Meio_de_pagamento.belongsTo(Status, { foreignKey: 'statusId', as: 'status' });
Status.hasMany(Meio_de_pagamento, { foreignKey: 'statusId', as: 'meiosDePagamento' });

Pets.belongsTo(Status, { foreignKey: 'statusId', as: 'status' });
Status.hasMany(Pets, { foreignKey: 'statusId', as: 'pets' });

TabelaDePrecos.belongsTo(Status, { foreignKey: 'statusId', as: 'status' });
Status.hasMany(TabelaDePrecos, { foreignKey: 'statusId', as: 'tabelasDePreco' });

Movimentos.belongsTo(Status, { foreignKey: 'statusId', as: 'status' });
Status.hasMany(Movimentos, { foreignKey: 'statusId', as: 'movimentos' });


/* ------------------------------------------------------------------
 * RELACIONAMENTO ESPECIE ↔ RAÇAS
 * ----------------------------------------------------------------*/
Racas.belongsTo(Especie, { foreignKey: 'especieId', as: 'especie' });
Especie.hasMany(Racas, { foreignKey: 'especieId', as: 'racas' });


/* ------------------------------------------------------------------
 * RELACIONAMENTO PET ↔ CLIENTES, RAÇAS (sem ESPECIE)
 * ----------------------------------------------------------------*/
Pets.belongsTo(Clientes, { foreignKey: 'clienteId', as: 'cliente' });
Clientes.hasMany(Pets, { foreignKey: 'clienteId', as: 'pets' });

Pets.belongsTo(Racas, { foreignKey: 'racaId', as: 'raca' });
Racas.hasMany(Pets, { foreignKey: 'racaId', as: 'pets' });


/* ------------------------------------------------------------------
 * RELACIONAMENTOS DA TABELA_DE_PRECOS
 * ----------------------------------------------------------------*/
TabelaDePrecos.belongsTo(Servicos, { foreignKey: 'servicoId', as: 'servico' });
Servicos.hasMany(TabelaDePrecos, { foreignKey: 'servicoId', as: 'tabelasDePreco' });

TabelaDePrecos.belongsTo(CondicaoDePagamento, { foreignKey: 'condicaoDePagamentoId', as: 'condicaoDePagamento' });
CondicaoDePagamento.hasMany(TabelaDePrecos, { foreignKey: 'condicaoDePagamentoId', as: 'tabelasDePreco' });

TabelaDePrecos.belongsTo(Racas, { foreignKey: 'racaId', as: 'raca' });
Racas.hasMany(TabelaDePrecos, { foreignKey: 'racaId', as: 'tabelasDePreco' });

TabelaDePrecos.belongsTo(Pets, { foreignKey: 'petId', as: 'pet' });
Pets.hasMany(TabelaDePrecos, { foreignKey: 'petId', as: 'tabelasDePreco' });


/* ------------------------------------------------------------------
 * RELACIONAMENTOS DO MÓDULO MOVIMENTOS
 * ----------------------------------------------------------------*/
Movimentos.belongsTo(Clientes, { foreignKey: 'clienteId', as: 'cliente' });
Clientes.hasMany(Movimentos, { foreignKey: 'clienteId', as: 'movimentos' });

Movimentos.belongsTo(Pets, { foreignKey: 'petId', as: 'pet' });
Pets.hasMany(Movimentos, { foreignKey: 'petId', as: 'movimentos' });

Movimentos.belongsTo(Servicos, { foreignKey: 'servicoId', as: 'servico' });
Servicos.hasMany(Movimentos, { foreignKey: 'servicoId', as: 'movimentos' });

Movimentos.belongsTo(CondicaoDePagamento, { foreignKey: 'condicaoPagamentoId', as: 'condicaoPagamento' });
CondicaoDePagamento.hasMany(Movimentos, { foreignKey: 'condicaoPagamentoId', as: 'movimentos' });

Movimentos.belongsTo(Meio_de_pagamento, { foreignKey: 'meioPagamentoId', as: 'meioDePagamento' });
Meio_de_pagamento.hasMany(Movimentos, { foreignKey: 'meioPagamentoId', as: 'movimentos' });

Movimentos.belongsTo(TabelaDePrecos, { foreignKey: 'tabelaDePrecosId', as: 'tabelaDePreco' });
TabelaDePrecos.hasMany(Movimentos, { foreignKey: 'tabelaDePrecosId', as: 'movimentos' });

Movimentos.belongsTo(Adiantamentos, { foreignKey: 'adiantamentoId', as: 'adiantamento' });
Adiantamentos.hasMany(Movimentos, { foreignKey: 'adiantamentoId', as: 'movimentos' });


/* ------------------------------------------------------------------
 * RELACIONAMENTO ADIANTAMENTOS ↔ PETS (1:1)
 * ----------------------------------------------------------------*/
Adiantamentos.belongsTo(Pets, { foreignKey: 'petId', as: 'pet' });
Pets.hasOne(Adiantamentos, { foreignKey: 'petId', as: 'adiantamento' });


/* ------------------------------------------------------------------
 * RELACIONAMENTO CONTAS_A_RECEBER
 * ----------------------------------------------------------------*/
ContasAReceber.belongsTo(Clientes, { foreignKey: 'clienteId', as: 'cliente' });
Clientes.hasMany(ContasAReceber, { foreignKey: 'clienteId', as: 'contasAReceber' });

ContasAReceber.belongsTo(Movimentos, { foreignKey: 'movimentoId', as: 'movimento' });
Movimentos.hasMany(ContasAReceber, { foreignKey: 'movimentoId', as: 'contasAReceber' });

ContasAReceber.belongsTo(Status, { foreignKey: 'statusId', as: 'status' });
Status.hasMany(ContasAReceber, { foreignKey: 'statusId', as: 'contasAReceber' });


/* ------------------------------------------------------------------
 * RELACIONAMENTO CONDICAO_PAGAMENTO_PARCELAS
 * ----------------------------------------------------------------*/
CondicaoPagamentoParcelas.belongsTo(CondicaoDePagamento, { foreignKey: 'condicaoPagamentoId', as: 'condicaoPagamento' });
CondicaoDePagamento.hasMany(CondicaoPagamentoParcelas, { foreignKey: 'condicaoPagamentoId', as: 'parcelas' });


/* ------------------------------------------------------------------
 * EXPORTS
 * ----------------------------------------------------------------*/
module.exports = {
  Servicos,
  Status,
  Racas,
  Clientes,
  Especie,
  CondicaoDePagamento,
  Meio_de_pagamento,
  Pets,
  TabelaDePrecos,
  Movimentos,
  Adiantamentos,
  ContasAReceber,
  CondicaoPagamentoParcelas,
};
