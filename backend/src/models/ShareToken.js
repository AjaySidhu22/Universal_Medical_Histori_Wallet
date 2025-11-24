// // \backend\src\models\ShareToken.js

// const { DataTypes } = require('sequelize');
// const { sequelize } = require('../config/database');
// const PatientProfile = require('./PatientProfile'); // Import for association

// const ShareToken = sequelize.define('ShareToken', {
//     token: {
//         type: DataTypes.STRING, // Store the SHA256 hash of the token
//         allowNull: false,
//         unique: true,
//     },
//     patientId: {
//         type: DataTypes.UUID,
//         allowNull: false,
//         // Foreign Key to PatientProfile
//     },
//     expiresAt: {
//         type: DataTypes.DATE,
//         allowNull: false,
//     },
//     // Optionally track who the token was intended for (e.g., a Doctor's email)
//     sharedWithEmail: {
//         type: DataTypes.STRING,
//         allowNull: true, 
//     }
// }, {
//     tableName: 'share_tokens',
//     timestamps: true,
//     updatedAt: false // Only interested in createdAt
// });

// module.exports = ShareToken;




const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const PatientProfile = require('./PatientProfile'); // Import for association

// Define allowed access scopes for granular sharing control
const ACCESS_SCOPES = ['full', 'basic', 'allergies_only', 'records_only'];

const ShareToken = sequelize.define('ShareToken', {
    token: {
        type: DataTypes.STRING(64), // SHA256 hash is 64 characters long
        allowNull: false,
        unique: true,
        comment: 'SHA256 hash of the raw share token (NEVER store the raw token)'
    },
    patientId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Foreign Key to the PatientProfile whose records are being shared'
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'Timestamp when the token becomes invalid'
    },
    accessScope: {
        type: DataTypes.ENUM(...ACCESS_SCOPES), // NEW: Granular access control
        allowNull: false,
        defaultValue: 'full', // Default to full access if scope is not specified
        comment: 'Defines the scope of medical data shared by this token'
    },
    sharedWithEmail: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Optional email of the intended recipient for tracking/auditing'
    }
}, {
    tableName: 'share_tokens',
    timestamps: true,
    updatedAt: false, // Tokens are immutable after creation, only revoked (deleted)
    indexes: [
        {
            // Index to speed up token lookup and expiration checks
            fields: ['token', 'expiresAt'] 
        }
    ],
    comment: 'Stores temporary, revokable tokens for sharing patient records'
});

module.exports = ShareToken;