// backend/src/models/patientProfileModel.js

'use strict';
const { Model } = require('sequelize');
const { encrypt, decrypt } = require('../utils/encryption');

module.exports = (sequelize, DataTypes) => {
  class PatientProfile extends Model {
    static associate(models) {
      // Belongs to User
      PatientProfile.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'User',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      // Has many MedicalRecords
      PatientProfile.hasMany(models.MedicalRecord, {
        foreignKey: 'patientId',
        as: 'MedicalRecords',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      // Has many ShareTokens
      PatientProfile.hasMany(models.ShareToken, {
        foreignKey: 'patientId',
        as: 'ShareTokens',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      // Has many AccessRequests (as patient)
      if (models.AccessRequest) {
        PatientProfile.hasMany(models.AccessRequest, {
          foreignKey: 'patientId',
          as: 'AccessRequests',
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        });
      }
    }
  }

  PatientProfile.init(
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
      dob: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
          isDate: { msg: 'Date of birth must be a valid date' },
          isBefore: {
            args: new Date().toISOString().split('T')[0],
            msg: 'Date of birth cannot be in the future'
          }
        }
      },
      bloodGroup: {
        type: DataTypes.STRING(10),
        allowNull: true,
        validate: {
          isIn: {
            args: [['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']],
            msg: 'Blood group must be one of: A+, A-, B+, B-, O+, O-, AB+, AB-'
          }
        }
      },
      allergies: {
        type: DataTypes.TEXT,
        allowNull: true,
        // ✅ NEW: Encrypt before saving to database
        set(value) {
          if (value) {
            this.setDataValue('allergies', encrypt(value));
          } else {
            this.setDataValue('allergies', null);
          }
        },
        // ✅ NEW: Decrypt when reading from database
        get() {
          const rawValue = this.getDataValue('allergies');
          if (rawValue) {
            try {
              return decrypt(rawValue);
            } catch (error) {
              console.error('Failed to decrypt allergies:', error);
              return null;
            }
          }
          return null;
        }
      },
      emergencyContactName: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: {
            args: [2, 100],
            msg: 'Emergency contact name must be between 2 and 100 characters'
          }
        }
      },
      emergencyContactNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          is: {
            args: /^[0-9+\-\s()]*$/,
            msg: 'Invalid phone number format'
          },
          len: {
            args: [7, 20],
            msg: 'Phone number must be between 7 and 20 characters'
          }
        }
      },
    },
    {
      sequelize,
      modelName: 'PatientProfile',
      tableName: 'PatientProfiles',
      paranoid: false,
      indexes: [
        {
          unique: true,
          fields: ['userId']
        }
      ]
    }
  );

  return PatientProfile;
};