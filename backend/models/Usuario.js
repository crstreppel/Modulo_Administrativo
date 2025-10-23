// v3.0 - Padrão Bruxão • Model Usuario (factory style)
// - statusId no padrão global (FK para Status)
// - roleId como FK para Role
// - Campos extras de segurança (tentativas, bloqueios, etc.)

module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define('Usuario', {
    nome: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(160),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    senhaHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    statusId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'FK para Status.id',
    },
    tentativasFalhas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    bloqueadoAte: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ultimoLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    precisaTrocarSenha: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'FK para Role.id',
    },
  }, {
    tableName: 'usuarios',
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['email'] },
      { fields: ['statusId'] },
      { fields: ['roleId'] },
    ],
  });

  return Usuario;
};
