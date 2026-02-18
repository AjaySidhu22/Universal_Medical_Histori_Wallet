// backend/migrations/20260209070610-add-qr-fields-to-share-tokens.js

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add lastAccessedAt column (if not exists)
    const tableDescription = await queryInterface.describeTable('ShareTokens');
    
    if (!tableDescription.lastAccessedAt) {
      await queryInterface.addColumn('ShareTokens', 'lastAccessedAt', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Last time this token was used'
      });
    }

    // Add purpose column (if not exists)
    if (!tableDescription.purpose) {
      await queryInterface.addColumn('ShareTokens', 'purpose', {
        type: Sequelize.STRING,
        defaultValue: 'emergency',
        allowNull: false,
        comment: 'Purpose of this share token (e.g., emergency, family, doctor)'
      });
    }

    // Add comments to existing columns
    await queryInterface.sequelize.query(`
      COMMENT ON COLUMN "ShareTokens"."token" IS 'Unique token for accessing records';
    `);

    await queryInterface.sequelize.query(`
      COMMENT ON COLUMN "ShareTokens"."accessScope" IS 'What level of access this token provides';
    `);

    await queryInterface.sequelize.query(`
      COMMENT ON COLUMN "ShareTokens"."expiresAt" IS 'When this token expires';
    `);

    await queryInterface.sequelize.query(`
      COMMENT ON COLUMN "ShareTokens"."isActive" IS 'Whether this token is currently active';
    `);

    await queryInterface.sequelize.query(`
      COMMENT ON COLUMN "ShareTokens"."maxUses" IS 'Maximum number of times token can be used (null = unlimited)';
    `);

    await queryInterface.sequelize.query(`
      COMMENT ON COLUMN "ShareTokens"."usageCount" IS 'Number of times token has been used';
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('ShareTokens', 'lastAccessedAt');
    await queryInterface.removeColumn('ShareTokens', 'purpose');
  }
};