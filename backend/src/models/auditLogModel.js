// backend/src/models/auditLogModel.js

'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AuditLog extends Model {
    static associate(models) {
      AuditLog.belongsTo(models.User, {
        foreignKey: 'actorId',
        onDelete: 'CASCADE',  // ✅ ADDED: Delete audit logs when user is deleted
        onUpdate: 'CASCADE'
      });
    }
  }

  AuditLog.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      actorId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      action: {
        type: DataTypes.ENUM('view', 'download', 'update', 'delete', 'share'),
        allowNull: false,
      },
      resourceType: {
        type: DataTypes.ENUM('MedicalRecord', 'PatientProfile', 'DoctorProfile'),
        allowNull: false,
      },
      resourceId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      ipAddress: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'AuditLog',
      tableName: 'AuditLogs',
      timestamps: false,
    }
  );

  return AuditLog;
};