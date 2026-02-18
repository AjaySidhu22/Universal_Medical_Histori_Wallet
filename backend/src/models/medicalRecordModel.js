 // backend/src/models/medicalRecordModel.js

'use strict';
const { Model } = require('sequelize');
const { encrypt, decrypt } = require('../utils/encryption');

module.exports = (sequelize, DataTypes) => {
  class MedicalRecord extends Model {
    static associate(models) {
      // Belongs to PatientProfile
      MedicalRecord.belongsTo(models.PatientProfile, {
        foreignKey: 'patientId',
        as: 'Patient',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      // Belongs to DoctorProfile (optional - patient can create their own)
      MedicalRecord.belongsTo(models.DoctorProfile, {
        foreignKey: 'doctorId',
        as: 'DoctorProfile',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
    }
  }

  MedicalRecord.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      patientId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      doctorId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [3, 200]
        }
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        // ✅ NEW: Encrypt before saving
        set(value) {
          if (value) {
            this.setDataValue('description', encrypt(value));
          } else {
            this.setDataValue('description', null);
          }
        },
        // ✅ NEW: Decrypt when reading
        get() {
          const rawValue = this.getDataValue('description');
          if (rawValue) {
            try {
              return decrypt(rawValue);
            } catch (error) {
              console.error('Failed to decrypt description:', error);
              return null;
            }
          }
          return null;
        }
      },
      diagnosis: {
        type: DataTypes.TEXT,
        allowNull: true,
        // ✅ NEW: Encrypt before saving
        set(value) {
          if (value) {
            this.setDataValue('diagnosis', encrypt(value));
          } else {
            this.setDataValue('diagnosis', null);
          }
        },
        // ✅ NEW: Decrypt when reading
        get() {
          const rawValue = this.getDataValue('diagnosis');
          if (rawValue) {
            try {
              return decrypt(rawValue);
            } catch (error) {
              console.error('Failed to decrypt diagnosis:', error);
              return null;
            }
          }
          return null;
        }
      },
      prescription: {
        type: DataTypes.TEXT,
        allowNull: true,
        // ✅ NEW: Encrypt before saving
        set(value) {
          if (value) {
            this.setDataValue('prescription', encrypt(value));
          } else {
            this.setDataValue('prescription', null);
          }
        },
        // ✅ NEW: Decrypt when reading
        get() {
          const rawValue = this.getDataValue('prescription');
          if (rawValue) {
            try {
              return decrypt(rawValue);
            } catch (error) {
              console.error('Failed to decrypt prescription:', error);
              return null;
            }
          }
          return null;
        }
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        // ✅ NEW: Encrypt before saving
        set(value) {
          if (value) {
            this.setDataValue('notes', encrypt(value));
          } else {
            this.setDataValue('notes', null);
          }
        },
        // ✅ NEW: Decrypt when reading
        get() {
          const rawValue = this.getDataValue('notes');
          if (rawValue) {
            try {
              return decrypt(rawValue);
            } catch (error) {
              console.error('Failed to decrypt notes:', error);
              return null;
            }
          }
          return null;
        }
      },
      fileKey: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'S3 key or local filename for uploaded file'
      },
      fileType: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'MIME type of uploaded file'
      },
      fileName: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Original filename'
      },
      fileSize: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'File size in bytes'
      },
      recordDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'MedicalRecord',
      tableName: 'MedicalRecords',
      paranoid: true,
      indexes: [
        {
          fields: ['patientId']
        },
        {
          fields: ['doctorId']
        },
        {
          fields: ['recordDate']
        }
      ]
    }
  );

  return MedicalRecord;
};