// backend/migrations/20260130191517-create-share-tokens-table.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ShareTokens', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      token: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      patientId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'PatientProfiles', key: 'id' },
        onDelete: 'CASCADE',
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      usageLimit: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      usageCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Optional: Add index on patientId for filtering by patient
    await queryInterface.addIndex('ShareTokens', ['patientId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ShareTokens');
  },
};

