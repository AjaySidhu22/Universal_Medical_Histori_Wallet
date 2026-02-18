// backend/migrations/20260207051408-add-access-duration-to-requests.js

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add requestedDuration column
    await queryInterface.addColumn('AccessRequests', 'requestedDuration', {
      type: Sequelize.DOUBLE,  // CHANGED: Was INTEGER, now DOUBLE for 0.5, 1, etc.
      allowNull: false,
      defaultValue: 48,
      comment: 'Requested access duration in hours'
    });

    // Add approvedDuration column
    await queryInterface.addColumn('AccessRequests', 'approvedDuration', {
      type: Sequelize.DOUBLE,  // CHANGED: Was INTEGER, now DOUBLE
      allowNull: true,
      comment: 'Patient-approved access duration in hours'
    });

    // Add comments to columns
    await queryInterface.sequelize.query(`
      COMMENT ON COLUMN "AccessRequests"."requestedDuration" IS 'Requested access duration in hours (0.5-720)';
    `);

    await queryInterface.sequelize.query(`
      COMMENT ON COLUMN "AccessRequests"."approvedDuration" IS 'Patient can approve with different duration in hours (0.5-720)';
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('AccessRequests', 'requestedDuration');
    await queryInterface.removeColumn('AccessRequests', 'approvedDuration');
  }
};