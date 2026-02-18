// \migrations\20260214112751-add-email-verification-fields.js

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('📧 Adding email verification fields to users table...');

    // Add isEmailVerified column
    await queryInterface.addColumn('users', 'isEmailVerified', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether the user has verified their email address'
    });
    console.log('✅ Added isEmailVerified column');

    // Add emailVerificationOtp column (encrypted)
    await queryInterface.addColumn('users', 'emailVerificationOtp', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Encrypted OTP for email verification'
    });
    console.log('✅ Added emailVerificationOtp column');

    // Add otpExpiresAt column
    await queryInterface.addColumn('users', 'otpExpiresAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Expiration time for the OTP'
    });
    console.log('✅ Added otpExpiresAt column');

    // Add otpAttempts column (for rate limiting)
    await queryInterface.addColumn('users', 'otpAttempts', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of OTP send attempts in current hour'
    });
    console.log('✅ Added otpAttempts column');

    // Add otpAttemptsResetAt column
    await queryInterface.addColumn('users', 'otpAttemptsResetAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'When to reset OTP attempts counter'
    });
    console.log('✅ Added otpAttemptsResetAt column');

    console.log('🎉 Email verification fields added successfully!');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('📧 Removing email verification fields from users table...');

    await queryInterface.removeColumn('users', 'otpAttemptsResetAt');
    await queryInterface.removeColumn('users', 'otpAttempts');
    await queryInterface.removeColumn('users', 'otpExpiresAt');
    await queryInterface.removeColumn('users', 'emailVerificationOtp');
    await queryInterface.removeColumn('users', 'isEmailVerified');

    console.log('🎉 Email verification fields removed successfully!');
  }
};