// const { DataTypes } = require('sequelize');
// const { sequelize } = require('../config/database');
// const User = require('./User');

// const DoctorProfile = sequelize.define('DoctorProfile', {
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
//   specialty: { type: DataTypes.STRING, allowNull: true },
//   licenseNumber: { type: DataTypes.STRING, allowNull: true }
// }, {
//   tableName: 'doctor_profiles'
// });

 

// module.exports = DoctorProfile;
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User'); // Import User model for conceptual link (associations are defined in index.js)

const DoctorProfile = sequelize.define('DoctorProfile', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        comment: 'Unique identifier for the doctor profile'
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true, // Ensures 1:1 relationship with the User model
        comment: 'Foreign key linking this profile to the User ID'
    },
    specialty: { 
        type: DataTypes.STRING, 
        allowNull: true,
        comment: 'Medical specialty (e.g., Cardiology, General Practice)'
    },
    licenseNumber: { 
        type: DataTypes.STRING, 
        allowNull: true,
        comment: 'Official medical license number for verification'
        /* // Example of adding validation for format consistency (optional)
        validate: {
            isLicenseFormat(value) {
                // Example regex for a hypothetical 2-letter, 6-digit license
                // if (value && !/^[A-Z]{2}\d{6}$/.test(value)) {
                //     throw new Error('Invalid license format.');
                // }
            }
        }
        */
    },
    isVerified: {
        type: DataTypes.BOOLEAN, // NEW: Flag for manual admin verification
        allowNull: false,
        defaultValue: false,
        comment: 'Whether the doctor has been verified by an administrator'
    }
}, {
    tableName: 'doctor_profiles',
    timestamps: true,
    // Add an index to speed up lookups by userId
    indexes: [
        {
            unique: true,
            fields: ['userId']
        }
    ],
    comment: 'Stores professional details for users with the doctor role'
});

module.exports = DoctorProfile;