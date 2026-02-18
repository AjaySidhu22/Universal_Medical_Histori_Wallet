// backend/migrations/20260130191511-create-users-table.js

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      role: {
        type: Sequelize.ENUM('admin', 'patient', 'doctor'),
        allowNull: false,
        defaultValue: 'patient',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      resetToken: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      resetTokenExpiry: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      refreshToken: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      refreshTokenExpiry: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
