// backend/migrations/20260130191514-create-doctor-profiles-table.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('DoctorProfiles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      specialty: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      licenseNumber: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      hospitalAffiliation: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      isVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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
    await queryInterface.dropTable('DoctorProfiles');
  },
};
