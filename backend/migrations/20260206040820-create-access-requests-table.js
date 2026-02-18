// backend/migrations/20260206040820-create-access-requests-table.js

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AccessRequests', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      doctorId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'DoctorProfiles', key: 'id' },
        onDelete: 'CASCADE',
      },
      patientId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'PatientProfiles', key: 'id' },
        onDelete: 'CASCADE',
      },
      requestType: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'view',
        comment: 'Type of access: view, create, both'
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pending',
        comment: 'Status: pending, approved, denied, expired'
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Doctor provides reason for access request'
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Request expires after 48 hours if not responded'
      },
      respondedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When patient approved/denied the request'
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

    // Add indexes for performance
    await queryInterface.addIndex('AccessRequests', ['doctorId']);
    await queryInterface.addIndex('AccessRequests', ['patientId']);
    await queryInterface.addIndex('AccessRequests', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('AccessRequests');
  }
};