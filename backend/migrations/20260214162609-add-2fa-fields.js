// backend\migrations\20260214162609-add-2fa-fields.js

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔐 Adding 2FA fields to users table...');

    // Add twoFactorEnabled column
    await queryInterface.addColumn('users', 'twoFactorEnabled', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether 2FA is enabled for this user'
    });
    console.log('✅ Added twoFactorEnabled column');

    // Add twoFactorSecret column (encrypted)
    await queryInterface.addColumn('users', 'twoFactorSecret', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Encrypted TOTP secret for 2FA'
    });
    console.log('✅ Added twoFactorSecret column');

    // Add backupCodes column (encrypted JSON array)
    await queryInterface.addColumn('users', 'backupCodes', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Encrypted backup codes for 2FA recovery'
    });
    console.log('✅ Added backupCodes column');

    console.log('🎉 2FA fields added successfully!');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔐 Removing 2FA fields from users table...');

    await queryInterface.removeColumn('users', 'backupCodes');
    await queryInterface.removeColumn('users', 'twoFactorSecret');
    await queryInterface.removeColumn('users', 'twoFactorEnabled');

    console.log('🎉 2FA fields removed successfully!');
  }
};