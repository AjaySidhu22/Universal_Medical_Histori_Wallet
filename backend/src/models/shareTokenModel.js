// backend/src/models/shareTokenModel.js

'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ShareToken extends Model {
    static associate(models) {
      ShareToken.belongsTo(models.PatientProfile, { 
        foreignKey: 'patientId',
        as: 'Patient'
      });
    }

    // Helper method to check if token is expired
    isExpired() {
      return new Date() > new Date(this.expiresAt);
    }

    // Helper method to check if token is active
    isActive() {
      return this.isActive && !this.isExpired();
    }
  }

  ShareToken.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      patientId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'PatientProfiles',
          key: 'id'
        }
      },
      token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: 'Unique token for accessing records'
      },
      accessScope: {
        type: DataTypes.ENUM('all', 'summary', 'emergency'),
        defaultValue: 'emergency',
        comment: 'What level of access this token provides'
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'When this token expires'
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Whether this token is currently active'
      },
      maxUses: {
        type: DataTypes.INTEGER,
        defaultValue: null,
        comment: 'Maximum number of times token can be used (null = unlimited)'
      },
      usageCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Number of times token has been used'
      },
      lastAccessedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Last time this token was used'
      },
      purpose: {
        type: DataTypes.STRING,
        defaultValue: 'emergency',
        comment: 'Purpose of this share token (e.g., emergency, family, doctor)'
      }
    },
    {
      sequelize,
      modelName: 'ShareToken',
      tableName: 'ShareTokens',
      indexes: [
        {
          fields: ['token'],
          unique: true
        },
        {
          fields: ['patientId']
        },
        {
          fields: ['expiresAt']
        }
      ]
    }
  );

  return ShareToken;
};