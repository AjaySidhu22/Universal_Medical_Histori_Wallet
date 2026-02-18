// backend/migrations/20260204143001-update-patient-profile-emergency-contacts.js

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if emergencyContact column exists (JSON format)
    const tableDescription = await queryInterface.describeTable('PatientProfiles');
    
    if (tableDescription.emergencyContact) {
      // Remove the old JSON column
      await queryInterface.removeColumn('PatientProfiles', 'emergencyContact');
    }

    // Add new separate columns for emergency contact
    if (!tableDescription.emergencyContactName) {
      await queryInterface.addColumn('PatientProfiles', 'emergencyContactName', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!tableDescription.emergencyContactNumber) {
      await queryInterface.addColumn('PatientProfiles', 'emergencyContactNumber', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    // Add allergies column if it doesn't exist
    if (!tableDescription.allergies) {
      await queryInterface.addColumn('PatientProfiles', 'allergies', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    // Change bloodGroup from ENUM to STRING for PostgreSQL compatibility
    if (tableDescription.bloodGroup && tableDescription.bloodGroup.type.includes('ENUM')) {
      // PostgreSQL requires special handling for ENUM changes
      await queryInterface.sequelize.query(`
        ALTER TABLE "PatientProfiles" 
        ALTER COLUMN "bloodGroup" TYPE VARCHAR(10);
      `);
    }
  },

  async down(queryInterface, Sequelize) {
    // Revert changes
    const tableDescription = await queryInterface.describeTable('PatientProfiles');

    if (tableDescription.emergencyContactName) {
      await queryInterface.removeColumn('PatientProfiles', 'emergencyContactName');
    }

    if (tableDescription.emergencyContactNumber) {
      await queryInterface.removeColumn('PatientProfiles', 'emergencyContactNumber');
    }

    if (tableDescription.allergies) {
      await queryInterface.removeColumn('PatientProfiles', 'allergies');
    }

    // Add back the JSON column
    await queryInterface.addColumn('PatientProfiles', 'emergencyContact', {
      type: Sequelize.JSON,
      allowNull: true,
    });
  }
};