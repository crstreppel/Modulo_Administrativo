// v2.2 - Padrão Bruxão • Model Role (factory style)
// - Índice explícito em nome
// - Preparado para associação com Usuario
// - Padrão alinhado aos outros models

module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nome: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true, // Ex.: 'admin', 'financeiro', 'operador'
      comment: 'Nome único da role',
    },
    descricao: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Descrição textual da role',
    },
  }, {
    tableName: 'roles',
    timestamps: true,
    paranoid: true, // soft delete
    indexes: [
      { unique: true, fields: ['nome'] },
    ],
  });

  return Role;
};
