const Servicos = require('./Servicos');
const Status = require('./Status');

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
