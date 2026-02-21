// /backend/migrations/20260221163000-add-isactive-to-sharetokens.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add isActive column to ShareTokens table
    await queryInterface.addColumn('ShareTokens', 'isActive', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove isActive column if we ever need to rollback
    await queryInterface.removeColumn('ShareTokens', 'isActive');
  }
};