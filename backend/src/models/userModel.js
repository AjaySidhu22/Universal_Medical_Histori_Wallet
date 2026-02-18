 // backend/src/models/userModel.js
'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasOne(models.PatientProfile, { foreignKey: 'userId', onDelete: 'CASCADE' });
      User.hasOne(models.DoctorProfile, { foreignKey: 'userId', onDelete: 'CASCADE' });
      if (models.AuditLog) {
        User.hasMany(models.AuditLog, { foreignKey: 'actorId' });
      }
    }

    // ✅ Instance method to compare passwords
    async comparePassword(plaintext) {
      return bcrypt.compare(plaintext, this.password);
    }
  }

 User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
  type: DataTypes.STRING,
  unique: true,
  allowNull: false,
},
username: {   
  type: DataTypes.STRING(30),
  unique: true,
  allowNull: false,
  validate: {
    len: {
      args: [3, 30],
      msg: 'Username must be between 3 and 30 characters'
    },
    is: {
      args: /^[a-zA-Z0-9_-]+$/,
      msg: 'Username can only contain letters, numbers, underscores, and dashes'
    },
    notEmpty: {
      msg: 'Username cannot be empty'
    }
  },
  comment: 'Unique username for easy identification (e.g., @john_smith)'
},
password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('admin', 'patient', 'doctor'),
      allowNull: false,
      defaultValue: 'patient',
    },
    resetToken: DataTypes.STRING,
    resetTokenExpiry: DataTypes.DATE,
    refreshToken: DataTypes.TEXT,
    refreshTokenExpiry: DataTypes.DATE,
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
    // ✅ NEW: Email verification fields
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether the user has verified their email address'
    },
    emailVerificationOtp: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Encrypted OTP for email verification'
    },
    otpExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Expiration time for the OTP'
    },
    otpAttempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of OTP send attempts in current hour'
    },
     otpAttemptsResetAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When to reset OTP attempts counter'
    },
    // ✅ NEW: 2FA fields
    twoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether 2FA is enabled for this user'
    },
    twoFactorSecret: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Encrypted TOTP secret for 2FA'
    },
    backupCodes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Encrypted backup codes for 2FA recovery'
    }
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    paranoid: false,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  }
);

  return User;
};
