// backend/src/models/doctorProfileModel.js

'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DoctorProfile extends Model {
    static associate(models) {
      // Belongs to User
      DoctorProfile.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'User',
        onDelete: 'CASCADE',  // ✅ ADDED: Cascade delete when user is deleted
        onUpdate: 'CASCADE'   // ✅ ADDED: Cascade update when user ID changes
      });

      // Has many MedicalRecords
      DoctorProfile.hasMany(models.MedicalRecord, {
        foreignKey: 'doctorId',
        as: 'MedicalRecords',
        onDelete: 'SET NULL',  // ✅ CHANGED: Set to NULL instead of CASCADE (preserve records)
        onUpdate: 'CASCADE'
      });

      // Has many AccessRequests (as doctor)
      if (models.AccessRequest) {
        DoctorProfile.hasMany(models.AccessRequest, {
          foreignKey: 'doctorId',
          as: 'AccessRequests',
          onDelete: 'CASCADE',  // ✅ ADDED: Delete requests when doctor is deleted
          onUpdate: 'CASCADE'
        });
      }
    }
  }

  DoctorProfile.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Name is required' },
          len: {
            args: [2, 100],
            msg: 'Name must be between 2 and 100 characters'
          }
        }
      },
      specialty: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Specialty is required' }
        }
      },
      licenseNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: { msg: 'License number is required' }
        }
      },
      hospitalAffiliation: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: 'DoctorProfile',
      tableName: 'DoctorProfiles',
      paranoid: false,
      indexes: [
        {
          unique: true,
          fields: ['userId']
        },
        {
          unique: true,
          fields: ['licenseNumber']
        }
      ]
    }
  );

  return DoctorProfile;
};