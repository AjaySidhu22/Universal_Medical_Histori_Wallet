// // backend/src/models/MedicalRecord.js
// const { DataTypes } = require('sequelize');
// const { sequelize } = require('../config/database');

// const MedicalRecord = sequelize.define('MedicalRecord', {
//   id: {
//     type: DataTypes.UUID,
//     defaultValue: DataTypes.UUIDV4,
//     primaryKey: true,
//   },
//   patientId: {
//     // will reference PatientProfile.id (set up association later)
//     type: DataTypes.UUID,
//     allowNull: false,
//   },
//   doctorId: {
//     // optional: the doctor who created/added this record (set up association later)
//     type: DataTypes.UUID,
//     allowNull: true,
//   },
//   title: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   description: {
//     type: DataTypes.TEXT,
//     allowNull: true,
//   },
//   filePath: {
//     // path to uploaded file (if any)
//     type: DataTypes.STRING,
//     allowNull: true,
//   },
//   recordDate: {
//     // date of the medical event/report
//     type: DataTypes.DATE,
//     allowNull: true,
//   },
//   metadata: {
//     // optional JSON metadata (Sequelize will handle for sqlite/postgres)
//     type: DataTypes.JSON,
//     allowNull: true,
//   }
// }, {
//   tableName: 'medical_records',
//   timestamps: true
// });

// module.exports = MedicalRecord;



const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Define allowed medical record types for categorization and filtering
const RECORD_TYPES = ['Diagnosis', 'LabReport', 'Prescription', 'Procedure', 'Other'];

const MedicalRecord = sequelize.define('MedicalRecord', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        comment: 'Unique identifier for the medical record entry'
    },
    patientId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Foreign Key to the PatientProfile'
    },
    doctorId: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Foreign Key to the DoctorProfile who created the record (can be NULL if created by Admin or import)'
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Short, descriptive title of the record'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Detailed description of the event, diagnosis, or treatment'
    },
    recordType: {
        type: DataTypes.ENUM(...RECORD_TYPES), // NEW: For categorization and filtering
        allowNull: true,
        comment: 'Type of medical record (e.g., LabReport, Prescription)'
    },
    filePath: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Relative path to the uploaded file attachment (e.g., /uploads/xyz.pdf)'
    },
    recordDate: {
        type: DataTypes.DATEONLY, // UPDATED: Changed from DATE to DATEONLY for consistency
        allowNull: true,
        comment: 'The actual date of the medical event'
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Flexible JSON field for unstructured/additional data (e.g., ICD-10 codes)'
    }
}, {
    tableName: 'medical_records',
    timestamps: true,
    // CRITICAL: Add index on patientId for fast retrieval and ordering by date
    indexes: [
        {
            name: 'records_by_patient_date_idx',
            fields: ['patientId', { attribute: 'recordDate', order: 'DESC' }]
        }
    ],
    comment: 'Stores the patient\'s chronological medical history'
});

module.exports = MedicalRecord;