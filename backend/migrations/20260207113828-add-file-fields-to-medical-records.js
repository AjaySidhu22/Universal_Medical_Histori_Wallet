// backend/migrations/20260207113828-add-file-fields-to-medical-records.js

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add fileName column
    await queryInterface.addColumn('MedicalRecords', 'fileName', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Original filename of uploaded file'
    });

    // Add fileSize column
    await queryInterface.addColumn('MedicalRecords', 'fileSize', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'File size in bytes'
    });

    // Add comments to existing columns
    await queryInterface.sequelize.query(`
      COMMENT ON COLUMN "MedicalRecords"."fileKey" IS 'S3 key or local filename for uploaded file';
    `);

    await queryInterface.sequelize.query(`
      COMMENT ON COLUMN "MedicalRecords"."fileType" IS 'MIME type of uploaded file (e.g., image/jpeg, application/pdf)';
    `);

    await queryInterface.sequelize.query(`
      COMMENT ON COLUMN "MedicalRecords"."fileName" IS 'Original filename of uploaded file';
    `);

    await queryInterface.sequelize.query(`
      COMMENT ON COLUMN "MedicalRecords"."fileSize" IS 'File size in bytes';
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('MedicalRecords', 'fileName');
    await queryInterface.removeColumn('MedicalRecords', 'fileSize');
  }
};


 