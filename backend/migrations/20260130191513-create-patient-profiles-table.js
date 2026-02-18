// backend/migrations/20260130191513-create-patient-profiles-table.js

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PatientProfiles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      dob: {
        type: Sequelize.DATEONLY,
        allowNull: true, // ✅ FIXED: Made optional
      },
      bloodGroup: {
        type: Sequelize.STRING, // ✅ FIXED: Changed from ENUM to STRING for SQLite compatibility
        allowNull: true,
      },
      emergencyContact: {
        type: Sequelize.JSON, // ✅ FIXED: Changed from JSONB to JSON
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('PatientProfiles');
  },
};