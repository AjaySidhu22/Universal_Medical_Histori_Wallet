'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add username column
    await queryInterface.addColumn('users', 'username', {
      type: Sequelize.STRING(30),
      allowNull: true,
      comment: 'Unique username for easy identification (e.g., @john_smith)'
    });

    // Generate usernames for existing users (email prefix)
    const [users] = await queryInterface.sequelize.query(
      `SELECT id, email FROM users WHERE username IS NULL`
    );

    for (const user of users) {
      const emailPrefix = user.email.split('@')[0];
      const uniqueSuffix = user.id.slice(-4);
      const username = `${emailPrefix}_${uniqueSuffix}`.toLowerCase();
      
      await queryInterface.sequelize.query(
        `UPDATE users SET username = :username WHERE id = :id`,
        {
          replacements: { username, id: user.id }
        }
      );
    }

    // Make username NOT NULL
    await queryInterface.sequelize.query(
      `ALTER TABLE users ALTER COLUMN username SET NOT NULL`
    );

    // Add unique constraint
    await queryInterface.addConstraint('users', {
      fields: ['username'],
      type: 'unique',
      name: 'users_username_unique'
    });

    // Add index for faster searches
    await queryInterface.addIndex('users', ['username'], {
      name: 'idx_users_username'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove index
    await queryInterface.removeIndex('users', 'idx_users_username');
    
    // Remove unique constraint
    await queryInterface.removeConstraint('users', 'users_username_unique');
    
    // Remove username column
    await queryInterface.removeColumn('users', 'username');
  }
};