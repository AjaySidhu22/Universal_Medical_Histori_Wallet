// backend/migrations/20260131183347-create-audit-logs-table.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AuditLogs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4, // ✅ FIXED: Works in both SQLite and PostgreSQL
        primaryKey: true,
      },
      actorId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      action: {
        type: Sequelize.STRING, // ✅ FIXED: SQLite doesn't support ENUM, use STRING
        allowNull: false,
      },
      resourceType: {
        type: Sequelize.STRING, // ✅ FIXED: SQLite doesn't support ENUM, use STRING
        allowNull: false,
      },
      resourceId: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      ipAddress: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      timestamp: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'), // ✅ FIXED: Works in both
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('AuditLogs');
  },
};