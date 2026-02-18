// backend/migrations/20260130191516-create-medical-records-table.js

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('MedicalRecords', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      patientId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'PatientProfiles', key: 'id' },
        onDelete: 'CASCADE',
      },
      doctorId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'DoctorProfiles', key: 'id' },
        onDelete: 'SET NULL',
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT, // ✅ CHANGED: TEXT instead of BLOB
        allowNull: true,
      },
      diagnosis: { // ✅ NEW
        type: Sequelize.TEXT,
        allowNull: true,
      },
      prescription: { // ✅ NEW
        type: Sequelize.TEXT,
        allowNull: true,
      },
      notes: { // ✅ NEW
        type: Sequelize.TEXT,
        allowNull: true,
      },
      fileKey: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      fileType: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      recordDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
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

    // Index for patientId
    await queryInterface.addIndex('MedicalRecords', ['patientId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('MedicalRecords');
  },
};