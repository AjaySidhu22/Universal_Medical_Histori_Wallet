// backend/20260101000000-add-file-resource-type.js

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('MedicalRecords', 'fileResourceType', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Cloudinary resource type: image or raw'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('MedicalRecords', 'fileResourceType');
  }
};