// backend/migrations/20260204142743-add-missing-sharetoken-fields.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('ShareTokens');
    
    // Add usageLimit column only if it doesn't exist
    if (!tableInfo.usageLimit) {
      await queryInterface.addColumn('ShareTokens', 'usageLimit', {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: false,
      });
      console.log('Added usageLimit column');
    }
    
    // Add usageCount column only if it doesn't exist
    if (!tableInfo.usageCount) {
      await queryInterface.addColumn('ShareTokens', 'usageCount', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      });
      console.log('Added usageCount column');
    }
    
    // Add sharedWithEmail column only if it doesn't exist
    if (!tableInfo.sharedWithEmail) {
      await queryInterface.addColumn('ShareTokens', 'sharedWithEmail', {
        type: Sequelize.STRING,
        allowNull: true,
      });
      console.log('Added sharedWithEmail column');
    }
    
    // Add accessScope column only if it doesn't exist
    if (!tableInfo.accessScope) {
      await queryInterface.addColumn('ShareTokens', 'accessScope', {
        type: Sequelize.STRING,
        defaultValue: 'full',
        allowNull: false,
      });
      console.log('Added accessScope column');
    }
    
    // Add indexes
    try {
      await queryInterface.addIndex('ShareTokens', ['patientId'], {
        name: 'share_tokens_patient_id_idx',
      });
      console.log('Added patientId index');
    } catch (error) {
      console.log('Index already exists:', error.message);
    }
    
    try {
      await queryInterface.addIndex('ShareTokens', ['expiresAt'], {
        name: 'share_tokens_expires_at_idx',
      });
      console.log('Added expiresAt index');
    } catch (error) {
      console.log('Index already exists:', error.message);
    }
  },

  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('ShareTokens');
    
    if (tableInfo.usageLimit) {
      await queryInterface.removeColumn('ShareTokens', 'usageLimit');
    }
    if (tableInfo.usageCount) {
      await queryInterface.removeColumn('ShareTokens', 'usageCount');
    }
    if (tableInfo.sharedWithEmail) {
      await queryInterface.removeColumn('ShareTokens', 'sharedWithEmail');
    }
    if (tableInfo.accessScope) {
      await queryInterface.removeColumn('ShareTokens', 'accessScope');
    }
    
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