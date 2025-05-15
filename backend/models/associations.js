const Servicos = require('./Servicos');
const Status = require('./Status');
const Racas = require('./Racas');

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

module.exports = {
  Servicos,
  Status,
  Racas,
};
