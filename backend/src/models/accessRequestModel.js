// backend/src/models/accessRequestModel.js

'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AccessRequest extends Model {
    static associate(models) {
      // Belongs to DoctorProfile
      AccessRequest.belongsTo(models.DoctorProfile, { 
        foreignKey: 'doctorId',
        as: 'DoctorProfile'
      });
      
      // Belongs to PatientProfile
      AccessRequest.belongsTo(models.PatientProfile, { 
        foreignKey: 'patientId',
        as: 'PatientProfile'
      });
    }

    /**
     * Check if request is expired
     */
    isExpired() {
      return new Date() > new Date(this.expiresAt);
    }

    /**
     * Check if request is pending
     */
    isPending() {
      return this.status === 'pending' && !this.isExpired();
    }

    /**
     * Check if doctor has active approved access
     */
    isApproved() {
      return this.status === 'approved' && !this.isExpired();
    }
  }

  AccessRequest.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      doctorId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      patientId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      requestType: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'view',
        validate: {
          isIn: {
            args: [['view', 'create', 'both']],
            msg: 'Request type must be: view, create, or both'
          }
        }
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending',
        validate: {
          isIn: {
            args: [['pending', 'approved', 'denied', 'expired']],
            msg: 'Status must be: pending, approved, denied, or expired'
          }
        }
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      requestedDuration: {
        type: DataTypes.FLOAT,  // CHANGED: Was INTEGER, now FLOAT to support 0.5, 1, etc.
        allowNull: false,
        defaultValue: 48,
        validate: {
          min: 0.5,  // CHANGED: Was 1, now 0.5 to support 30 minutes
          max: 720
        }
      },
      approvedDuration: {
        type: DataTypes.FLOAT,  // CHANGED: Was INTEGER, now FLOAT
        allowNull: true,
        validate: {
          min: 0.5,  // CHANGED: Was 1, now 0.5
          max: 720
        }
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          isDate: true,
          isAfter: new Date().toISOString()
        }
      },
      respondedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'AccessRequest',
      tableName: 'AccessRequests',
      paranoid: true,
      indexes: [
        {
          fields: ['doctorId']
        },
        {
          fields: ['patientId']
        },
        {
          fields: ['status']
        },
        {
          fields: ['doctorId', 'patientId', 'status']
        }
      ]
    }
  );

  return AccessRequest;
};