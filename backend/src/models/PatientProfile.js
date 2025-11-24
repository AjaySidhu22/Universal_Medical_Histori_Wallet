// const { DataTypes } = require('sequelize');
// const { sequelize } = require('../config/database');
// const User = require('./User');

// const PatientProfile = sequelize.define('PatientProfile', {
//   id: {
//     type: DataTypes.UUID,
//     defaultValue: DataTypes.UUIDV4,
//     primaryKey: true,
//   },
//   userId: {
//     type: DataTypes.UUID,
//     allowNull: false,
//     unique: true
//   },
//   dateOfBirth: { type: DataTypes.DATEONLY, allowNull: true },
//   bloodGroup: { type: DataTypes.STRING, allowNull: true },
//   allergies: { type: DataTypes.TEXT, allowNull: true },
//   emergencyContactName: { type: DataTypes.STRING, allowNull: true },
//   emergencyContactNumber: { type: DataTypes.STRING, allowNull: true },
// }, {
//   tableName: 'patient_profiles'
// });

// // association (call after all models imported in bootstrap, but using manual if needed)
 

// module.exports = PatientProfile;

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Define allowed blood groups for data integrity
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const PatientProfile = sequelize.define('PatientProfile', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        comment: 'Unique identifier for the patient profile (separate from user ID)'
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true, // Ensures 1:1 relationship with the User model
        comment: 'Foreign key linking this profile to the User ID'
    },
    dateOfBirth: { 
        type: DataTypes.DATEONLY, 
        allowNull: true,
        comment: 'Patient date of birth'
    },
    bloodGroup: { 
        type: DataTypes.ENUM(...BLOOD_GROUPS), // ENUM for data integrity
        allowNull: true,
        comment: 'Patient blood type (e.g., A+, O-)'
    },
    allergies: { 
        type: DataTypes.TEXT, 
        allowNull: true,
        comment: 'Detailed list of known allergies'
    },
    emergencyContactName: { 
        type: DataTypes.STRING, 
        allowNull: true,
        comment: 'Name of emergency contact'
    },
    emergencyContactNumber: { 
        type: DataTypes.STRING, // Kept as STRING to handle international formats/symbols
        allowNull: true,
        comment: 'Phone number of emergency contact'
    },
}, {
    tableName: 'patient_profiles',
    timestamps: true,
    // Add an index to speed up lookups by userId
    indexes: [
        {
            unique: true,
            fields: ['userId']
        }
    ],
    comment: 'Stores non-authentication medical and personal patient data'
});

module.exports = PatientProfile;