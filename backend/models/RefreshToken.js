// backend/models/RefreshToken.js
// v3.1 - Padrão Bruxão • Model RefreshToken (alinhado ao Controller)
// - Usa jti (UUID) + tokenHash (SHA256 do token opaco)
// - Metadados de sessão + ciclo de vida
// - À prova de burradas cósmicas ⚡

module.exports = (sequelize, DataTypes) => {
  const RefreshToken = sequelize.define('RefreshToken', {
    // Identificador único do token (usado em auditoria/logs)
    jti: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Identificador único do refresh token',
    },

    // Hash do token opaco (não armazenar o token cru no banco!)
    tokenHash: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true,
      comment: 'SHA256 do token opaco',
    },

    // Dono do token (FK -> Usuario.id)
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'FK para Usuario.id',
    },

    // Metadados de sessão
    userAgent: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'User-Agent do dispositivo que gerou o token',
    },
    ip: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'IPv4/IPv6 do dispositivo',
    },

    // Ciclo de vida
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Data/hora de expiração',
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Data/hora de revogação',
    },
  }, {
    tableName: 'refresh_tokens',
    timestamps: true,   // createdAt / updatedAt
    paranoid: true,     // deletedAt (soft delete)
    underscored: false,

    indexes: [
      { fields: ['usuarioId'] },
      { fields: ['expiresAt'] },
      { unique: true, fields: ['tokenHash'] },
    ],
  });

  /* ------------------------------------------------------------
   * MÉTODOS DE INSTÂNCIA (validação rápida no próprio objeto)
   * ----------------------------------------------------------*/
  RefreshToken.prototype.isExpired = function () {
    return this.expiresAt ? new Date(this.expiresAt) <= new Date() : false;
  };

  RefreshToken.prototype.isRevoked = function () {
    return !!this.revokedAt;
  };

  RefreshToken.prototype.isActive = function () {
    return !this.isExpired() && !this.isRevoked();
  };

  return RefreshToken;
};
