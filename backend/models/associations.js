const Servicos  = require('./Servicos');
const Status    = require('./Status');
const Racas     = require('./Racas');
const Clientes  = require('./Clientes');
const Especie   = require('./Especie');   // <-- novo

/* ------------------------------------------------------------------
 * RELACIONAMENTOS COM STATUS
 * ----------------------------------------------------------------*/
 // Serviço pertence a um Status
Servicos.belongsTo(Status, {
  foreignKey: 'statusId',
  as: 'status',
});

// Um Status pode ter muitos Serviços
Status.hasMany(Servicos, {
  foreignKey: 'statusId',
  as: 'servicos',
});

// Raça pertence a um Status
Racas.belongsTo(Status, {
  foreignKey: 'statusId',
  as: 'status',
});

// Um Status pode ter muitas Raças
Status.hasMany(Racas, {
  foreignKey: 'statusId',
  as: 'racas',
});

// Cliente pertence a um Status
Clientes.belongsTo(Status, {
  foreignKey: 'statusId',
  as: 'status',
});

// Um Status pode ter muitos Clientes
Status.hasMany(Clientes, {
  foreignKey: 'statusId',
  as: 'clientes',
});

// Especie pertence a um Status
Especie.belongsTo(Status, {
  foreignKey: 'statusId',
  as: 'status',
});

// Um Status pode ter muitas Especies
Status.hasMany(Especie, {
  foreignKey: 'statusId',
  as: 'especies',
});

/* ------------------------------------------------------------------
 * RELACIONAMENTO ESPECIE ↔ RAÇAS
 * ----------------------------------------------------------------*/
// Uma Raça pertence a uma Espécie
Racas.belongsTo(Especie, {
  foreignKey: 'especieId',
  as: 'especie',
});

// Uma Espécie pode ter muitas Raças
Especie.hasMany(Racas, {
  foreignKey: 'especieId',
  as: 'racas',
});

/* ------------------------------------------------------------------
 * EXPORTS
 * ----------------------------------------------------------------*/
module.exports = {
  Servicos,
  Status,
  Racas,
  Clientes,
  Especie,   // <-- novo
};
