// const { DataTypes } = require('sequelize');
// const { sequelize } = require('../config/database');
// const bcrypt = require('bcryptjs');

// const User = sequelize.define('User', {
//   id: {
//     type: DataTypes.UUID,
//     defaultValue: DataTypes.UUIDV4,
//     primaryKey: true
//   },
//   email: {
//     type: DataTypes.STRING,
//     unique: true,
//     allowNull: false,
//     validate: { isEmail: true }
//   },
//   password: {
//     type: DataTypes.STRING,
//     allowNull: false
//   },
//   role: { // 'patient' | 'doctor' | 'admin'
//     type: DataTypes.STRING,
//     allowNull: false,
//     defaultValue: 'patient'
//   },
//   resetToken: {
//     type: DataTypes.STRING,
//     allowNull: true,
//   },
//   resetTokenExpiry: {
//     type: DataTypes.DATE,
//     allowNull: true,
//   },
//   refreshToken: {
//     type: DataTypes.TEXT,   // ✅ use TEXT so we don’t worry about length
//     allowNull: true
//   },
//   refreshTokenExpiry: {
//     type: DataTypes.DATE,
//     allowNull: true
//   }

// }, {
//   tableName: 'users',
//   timestamps: true
// });

// // Password hashing hook
// User.beforeCreate(async (user, options) => {
//   if (user.password) {
//     const salt = await bcrypt.genSalt(10);
//     user.password = await bcrypt.hash(user.password, salt);
//   }
// });

// // Instance method to compare password
// User.prototype.comparePassword = async function (plaintext) {
//   return bcrypt.compare(plaintext, this.password);
// };

// module.exports = User;

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

// Define the allowed user roles using an ENUM data type
const USER_ROLES = ['patient', 'doctor', 'admin'];

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        comment: 'Unique identifier for the user (UUID v4)'
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: { isEmail: true },
        comment: 'User email, must be unique'
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Hashed password'
    },
    role: { 
        type: DataTypes.ENUM(...USER_ROLES), // CRITICAL: Enforce only these roles
        allowNull: false,
        defaultValue: 'patient',
        comment: 'User role: patient, doctor, or admin'
    },
    // Password Reset fields
    resetToken: {
        type: DataTypes.STRING, // Stores the SHA256 hash of the reset token
        allowNull: true,
    },
    resetTokenExpiry: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    // Refresh Token fields for long-lived sessions
    refreshToken: {
        type: DataTypes.TEXT, // Using TEXT for longer random string
        allowNull: true,
    },
    refreshTokenExpiry: {
        type: DataTypes.DATE,
        allowNull: true,
    }
}, {
    tableName: 'users',
    timestamps: true,
    comment: 'Stores user credentials and authentication data'
});

// --- SEQUELIZE HOOKS FOR SECURITY ---

/**
 * Hashing function to run before saving the password (for create and update)
 * @param {User} user - The user instance being modified
 * @param {Object} options - Sequelize options
 */
const hashPasswordHook = async (user) => {
    // Only hash the password if it is being created or modified
    if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
    }
};

// Hook 1: Hash password before a new user is created
User.beforeCreate(hashPasswordHook);

// Hook 2: Hash password before an existing user is updated (e.g., resetPassword)
User.beforeUpdate(hashPasswordHook);


// --- INSTANCE METHODS ---

/**
 * Compares a plain-text password with the stored hash.
 * @param {string} plaintext - The password provided by the user (e.g., during login).
 * @returns {Promise<boolean>} True if passwords match.
 */
User.prototype.comparePassword = async function (plaintext) {
    return bcrypt.compare(plaintext, this.password);
};

module.exports = User;