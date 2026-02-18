// backend/migrations/20260213000000-add-cascade-delete-constraints.js

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop existing foreign key constraints
    await queryInterface.sequelize.query(`
      ALTER TABLE "PatientProfiles" 
      DROP CONSTRAINT IF EXISTS "PatientProfiles_userId_fkey";
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "DoctorProfiles" 
      DROP CONSTRAINT IF EXISTS "DoctorProfiles_userId_fkey";
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "MedicalRecords" 
      DROP CONSTRAINT IF EXISTS "MedicalRecords_patientId_fkey";
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "AuditLogs" 
      DROP CONSTRAINT IF EXISTS "AuditLogs_actorId_fkey";
    `);

    // Add new constraints with CASCADE
    await queryInterface.sequelize.query(`
      ALTER TABLE "PatientProfiles" 
      ADD CONSTRAINT "PatientProfiles_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES users(id) 
      ON UPDATE CASCADE ON DELETE CASCADE;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "DoctorProfiles" 
      ADD CONSTRAINT "DoctorProfiles_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES users(id) 
      ON UPDATE CASCADE ON DELETE CASCADE;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "MedicalRecords" 
      ADD CONSTRAINT "MedicalRecords_patientId_fkey" 
      FOREIGN KEY ("patientId") REFERENCES "PatientProfiles"(id) 
      ON UPDATE CASCADE ON DELETE CASCADE;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "AuditLogs" 
      ADD CONSTRAINT "AuditLogs_actorId_fkey" 
      FOREIGN KEY ("actorId") REFERENCES users(id) 
      ON UPDATE CASCADE ON DELETE CASCADE;
    `);

    console.log('✅ CASCADE DELETE constraints added successfully');
  },

  down: async (queryInterface, Sequelize) => {
    // Rollback: Remove CASCADE and restore original constraints
    await queryInterface.sequelize.query(`
      ALTER TABLE "PatientProfiles" 
      DROP CONSTRAINT IF EXISTS "PatientProfiles_userId_fkey";
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "DoctorProfiles" 
      DROP CONSTRAINT IF EXISTS "DoctorProfiles_userId_fkey";
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "MedicalRecords" 
      DROP CONSTRAINT IF EXISTS "MedicalRecords_patientId_fkey";
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "AuditLogs" 
      DROP CONSTRAINT IF EXISTS "AuditLogs_actorId_fkey";
    `);

    // Restore original constraints (UPDATE CASCADE only)
    await queryInterface.sequelize.query(`
      ALTER TABLE "PatientProfiles" 
      ADD CONSTRAINT "PatientProfiles_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES users(id) 
      ON UPDATE CASCADE;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "DoctorProfiles" 
      ADD CONSTRAINT "DoctorProfiles_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES users(id) 
      ON UPDATE CASCADE;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "MedicalRecords" 
      ADD CONSTRAINT "MedicalRecords_patientId_fkey" 
      FOREIGN KEY ("patientId") REFERENCES "PatientProfiles"(id) 
      ON UPDATE CASCADE;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "AuditLogs" 
      ADD CONSTRAINT "AuditLogs_actorId_fkey" 
      FOREIGN KEY ("actorId") REFERENCES users(id) 
      ON UPDATE CASCADE;
    `);

    console.log('✅ CASCADE DELETE constraints removed (rollback complete)');
  }
};