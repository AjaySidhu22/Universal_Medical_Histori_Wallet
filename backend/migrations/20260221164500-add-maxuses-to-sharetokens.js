// /backend/migrations/20260221164500-add-maxuses-to-sharetokens.js

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Add the missing maxUses column
    await queryInterface.addColumn('ShareTokens', 'maxUses', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null // Null means unlimited uses by default unless specified
    });

    // 2. Proactively add useCount just in case your code tracks how many times it was scanned
    try {
      await queryInterface.addColumn('ShareTokens', 'useCount', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      });
    } catch (e) {
      console.log('useCount might already exist, skipping...');
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('ShareTokens', 'maxUses');
    try {
      await queryInterface.removeColumn('ShareTokens', 'useCount');
    } catch (e) {}
  }
};