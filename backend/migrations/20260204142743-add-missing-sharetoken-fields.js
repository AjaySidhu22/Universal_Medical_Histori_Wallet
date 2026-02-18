// backend/migrations/20260204142743-add-missing-sharetoken-fields.js

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add missing columns to ShareTokens table
    await queryInterface.addColumn('ShareTokens', 'usageLimit', {
      type: Sequelize.INTEGER,
      defaultValue: 1,
      allowNull: false,
    });

    await queryInterface.addColumn('ShareTokens', 'usageCount', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false,
    });

    await queryInterface.addColumn('ShareTokens', 'sharedWithEmail', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('ShareTokens', 'accessScope', {
      type: Sequelize.STRING,
      defaultValue: 'full',
      allowNull: false,
    });

    // Add index on patientId if it doesn't exist (idempotent)
    try {
      await queryInterface.addIndex('ShareTokens', ['patientId'], {
        name: 'share_tokens_patient_id_idx',
      });
    } catch (error) {
      console.log('Index already exists or could not be created:', error.message);
    }

    // Add index on expiresAt for query performance
    try {
      await queryInterface.addIndex('ShareTokens', ['expiresAt'], {
        name: 'share_tokens_expires_at_idx',
      });
    } catch (error) {
      console.log('Index already exists or could not be created:', error.message);
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove columns
    await queryInterface.removeColumn('ShareTokens', 'usageLimit');
    await queryInterface.removeColumn('ShareTokens', 'usageCount');
    await queryInterface.removeColumn('ShareTokens', 'sharedWithEmail');
    await queryInterface.removeColumn('ShareTokens', 'accessScope');

    // Remove indexes
    try {
      await queryInterface.removeIndex('ShareTokens', 'share_tokens_patient_id_idx');
    } catch (error) {
      console.log('Index does not exist:', error.message);
    }

    try {
      await queryInterface.removeIndex('ShareTokens', 'share_tokens_expires_at_idx');
    } catch (error) {
      console.log('Index does not exist:', error.message);
    }
  }
};