// backend/migrations/20260209070610-add-qr-fields-to-share-tokens.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('ShareTokens');
    
    // Add lastAccessedAt column (if not exists)
    if (!tableDescription.lastAccessedAt) {
      await queryInterface.addColumn('ShareTokens', 'lastAccessedAt', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Last time this token was used'
      });
      console.log('Added lastAccessedAt column');
    }
    
    // Add purpose column (if not exists)
    if (!tableDescription.purpose) {
      await queryInterface.addColumn('ShareTokens', 'purpose', {
        type: Sequelize.STRING,
        defaultValue: 'emergency',
        allowNull: false,
        comment: 'Purpose of this share token (e.g., emergency, family, doctor)'
      });
      console.log('Added purpose column');
    }
    
    // Add comments to existing columns (only if they exist)
    try {
      // Only add comments if the columns actually exist
      const columnsToComment = [
        { name: 'token', comment: 'Unique token for accessing records' },
        { name: 'accessScope', comment: 'What level of access this token provides' },
        { name: 'expiresAt', comment: 'When this token expires' },
        { name: 'isActive', comment: 'Whether this token is currently active' },
        { name: 'maxUses', comment: 'Maximum number of times token can be used (null = unlimited)' },
        { name: 'usageCount', comment: 'Number of times token has been used' }
      ];
      
      for (const col of columnsToComment) {
        if (tableDescription[col.name]) {
          await queryInterface.sequelize.query(`
            COMMENT ON COLUMN "ShareTokens"."${col.name}" IS '${col.comment}';
          `);
          console.log(`Added comment to ${col.name} column`);
        } else {
          console.log(`Skipping comment for ${col.name} - column does not exist`);
        }
      }
    } catch (error) {
      console.log('Could not add column comments (non-critical):', error.message);
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('ShareTokens');
    
    if (tableDescription.lastAccessedAt) {
      await queryInterface.removeColumn('ShareTokens', 'lastAccessedAt');
    }
    if (tableDescription.purpose) {
      await queryInterface.removeColumn('ShareTokens', 'purpose');
    }
  }
};