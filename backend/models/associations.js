const Servicos  = require('./Servicos');
const Status    = require('./Status');
const Racas     = require('./Racas');
const Clientes  = require('./Clientes');
const Especie   = require('./Especie');
const CondicaoDePagamento = require('./CondicaoDePagamento');
const Meio_de_pagamento = require('./Meio_de_pagamento');
const Pets      = require('./Pets'); // <-- novo

/* ------------------------------------------------------------------
 * RELACIONAMENTOS COM STATUS
 * ----------------------------------------------------------------*/
// Serviço pertence a um Status
Servicos.belongsTo(Status, {
  foreignKey: 'statusId',
  as: 'status',
});
Status.hasMany(Servicos, {
  foreignKey: 'statusId',
  as: 'servicos',
});

// Raça pertence a um Status
Racas.belongsTo(Status, {
  foreignKey: 'statusId',
  as: 'status',
});
Status.hasMany(Racas, {
  foreignKey: 'statusId',
  as: 'racas',
});

// Cliente pertence a um Status
Clientes.belongsTo(Status, {
  foreignKey: 'statusId',
  as: 'status',
});
Status.hasMany(Clientes, {
  foreignKey: 'statusId',
  as: 'clientes',
});

// Especie pertence a um Status
Especie.belongsTo(Status, {
  foreignKey: 'statusId',
  as: 'status',
});
Status.hasMany(Especie, {
  foreignKey: 'statusId',
  as: 'especies',
});

// CondicaoDePagamento pertence a um Status
CondicaoDePagamento.belongsTo(Status, {
  foreignKey: 'statusId',
  as: 'status',
});
Status.hasMany(CondicaoDePagamento, {
  foreignKey: 'statusId',
  as: 'condicoesDePagamento',
});

// Meio_de_pagamento pertence a um Status
Meio_de_pagamento.belongsTo(Status, {
  foreignKey: 'statusId',
  as: 'status',
});
Status.hasMany(Meio_de_pagamento, {
  foreignKey: 'statusId',
  as: 'meiosDePagamento',
});

// Pet pertence a um Status
Pets.belongsTo(Status, {
  foreignKey: 'statusId',
  as: 'status',
});
Status.hasMany(Pets, {
  foreignKey: 'statusId',
  as: 'pets',
});

/* ------------------------------------------------------------------
 * RELACIONAMENTO ESPECIE ↔ RAÇAS
 * ----------------------------------------------------------------*/
// Uma Raça pertence a uma Espécie
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
  Pets, // <-- novo
};
