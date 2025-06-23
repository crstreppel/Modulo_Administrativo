const Servicos = require('./Servicos');
const Status = require('./Status');
const Racas = require('./Racas');
const Clientes = require('./Clientes');
const Especie = require('./Especie');
const CondicaoDePagamento = require('./CondicaoDePagamento');
const Meio_de_pagamento = require('./MeioDePagamento');
const Pets = require('./Pets');
const TabelaDePrecos = require('./TabelaDePrecos');
const Movimentos = require('./Movimentos'); // <-- Novo

/* ------------------------------------------------------------------
 * RELACIONAMENTOS COM STATUS
 * ----------------------------------------------------------------*/
Servicos.belongsTo(Status, {
  foreignKey: 'statusId',
  as: 'status',
});
Status.hasMany(Servicos, {
  foreignKey: 'statusId',
  as: 'servicos',
});

Racas.belongsTo(Status, {
  foreignKey: 'statusId',
  as: 'status',
});
Status.hasMany(Racas, {
  foreignKey: 'statusId',
  as: 'racas',
});

Clientes.belongsTo(Status, {
  foreignKey: 'statusId',
  as: 'status',
});
Status.hasMany(Clientes, {
  foreignKey: 'statusId',
  as: 'clientes',
});

Especie.belongsTo(Status, {
  foreignKey: 'statusId',
  as: 'status',
});
Status.hasMany(Especie, {
  foreignKey: 'statusId',
  as: 'especies',
});

CondicaoDePagamento.belongsTo(Status, {
  foreignKey: 'statusId',
  as: 'status',
});
Status.hasMany(CondicaoDePagamento, {
  foreignKey: 'statusId',
  as: 'condicoesDePagamento',
});

Meio_de_pagamento.belongsTo(Status, {
  foreignKey: 'statusId',
  as: 'status',
});
Status.hasMany(Meio_de_pagamento, {
  foreignKey: 'statusId',
  as: 'meiosDePagamento',
});

Pets.belongsTo(Status, {
  foreignKey: 'statusId',
  as: 'status',
});
Status.hasMany(Pets, {
  foreignKey: 'statusId',
  as: 'pets',
});

TabelaDePrecos.belongsTo(Status, {
  foreignKey: 'statusId',
  as: 'status',
});
Status.hasMany(TabelaDePrecos, {
  foreignKey: 'statusId',
  as: 'tabelasDePreco',
});

Movimentos.belongsTo(Status, {
  foreignKey: 'statusId',
  as: 'status',
});
Status.hasMany(Movimentos, {
  foreignKey: 'statusId',
  as: 'movimentos',
});

/* ------------------------------------------------------------------
 * RELACIONAMENTO ESPECIE ↔ RAÇAS
 * ----------------------------------------------------------------*/
Racas.belongsTo(Especie, {
  foreignKey: 'especieId',
  as: 'especie',
});
Especie.hasMany(Racas, {
  foreignKey: 'especieId',
  as: 'racas',
});

/* ------------------------------------------------------------------
 * RELACIONAMENTO PET ↔ CLIENTES, ESPÉCIES, RAÇAS
 * ----------------------------------------------------------------*/
Pets.belongsTo(Clientes, {
  foreignKey: 'clienteId',
  as: 'cliente',
});
Clientes.hasMany(Pets, {
  foreignKey: 'clienteId',
  as: 'pets',
});

Pets.belongsTo(Especie, {
  foreignKey: 'especieId',
  as: 'especie',
});
Especie.hasMany(Pets, {
  foreignKey: 'especieId',
  as: 'pets',
});

Pets.belongsTo(Racas, {
  foreignKey: 'racaId',
  as: 'raca',
});
Racas.hasMany(Pets, {
  foreignKey: 'racaId',
  as: 'pets',
});

/* ------------------------------------------------------------------
 * RELACIONAMENTOS DA TABELA_DE_PRECOS
 * ----------------------------------------------------------------*/
TabelaDePrecos.belongsTo(Servicos, {
  foreignKey: 'servicoId',
  as: 'servico',
});
Servicos.hasMany(TabelaDePrecos, {
  foreignKey: 'servicoId',
  as: 'tabelasDePreco',
});

TabelaDePrecos.belongsTo(CondicaoDePagamento, {
  foreignKey: 'condicaoDePagamentoId',
  as: 'condicaoDePagamento',
});
CondicaoDePagamento.hasMany(TabelaDePrecos, {
  foreignKey: 'condicaoDePagamentoId',
  as: 'tabelasDePreco',
});

TabelaDePrecos.belongsTo(Meio_de_pagamento, {
  foreignKey: 'meioDePagamentoId',
  as: 'meioDePagamento',
});
Meio_de_pagamento.hasMany(TabelaDePrecos, {
  foreignKey: 'meioDePagamentoId',
  as: 'tabelasDePreco',
});

TabelaDePrecos.belongsTo(Racas, {
  foreignKey: 'racaId',
  as: 'raca',
});
Racas.hasMany(TabelaDePrecos, {
  foreignKey: 'racaId',
  as: 'tabelasDePreco',
});

TabelaDePrecos.belongsTo(Pets, {
  foreignKey: 'petId',
  as: 'pet',
});
Pets.hasMany(TabelaDePrecos, {
  foreignKey: 'petId',
  as: 'tabelasDePreco',
});

/* ------------------------------------------------------------------
 * RELACIONAMENTOS DO MÓDULO MOVIMENTOS
 * ----------------------------------------------------------------*/
Movimentos.belongsTo(Clientes, {
  foreignKey: 'clienteId',
  as: 'cliente',
});
Clientes.hasMany(Movimentos, {
  foreignKey: 'clienteId',
  as: 'movimentos',
});

Movimentos.belongsTo(Pets, {
  foreignKey: 'petId',
  as: 'pet',
});
Pets.hasMany(Movimentos, {
  foreignKey: 'petId',
  as: 'movimentos',
});

Movimentos.belongsTo(Servicos, {
  foreignKey: 'servicoId',
  as: 'servico',
});
Servicos.hasMany(Movimentos, {
  foreignKey: 'servicoId',
  as: 'movimentos',
});

Movimentos.belongsTo(CondicaoDePagamento, {
  foreignKey: 'condicaoPagamentoId',
  as: 'condicaoDePagamento',
});
CondicaoDePagamento.hasMany(Movimentos, {
  foreignKey: 'condicaoPagamentoId',
  as: 'movimentos',
});

Movimentos.belongsTo(Meio_de_pagamento, {
  foreignKey: 'meioPagamentoId',
  as: 'meioDePagamento',
});
Meio_de_pagamento.hasMany(Movimentos, {
  foreignKey: 'meioPagamentoId',
  as: 'movimentos',
});
Movimentos.belongsTo(TabelaDePrecos, {
  foreignKey: 'tabelaDePrecosId',
  as: 'tabelaDePreco',
});
TabelaDePrecos.hasMany(Movimentos, {
  foreignKey: 'tabelaDePrecosId',
  as: 'movimentos',
});

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
  Movimentos, // <-- Novo!
};
