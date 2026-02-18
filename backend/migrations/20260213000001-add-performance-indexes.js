// backend/migrations/20260213000001-add-performance-indexes.js

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('📊 Adding performance indexes...');

    // 1. AuditLogs indexes (for filtering and reporting)
    await queryInterface.addIndex('AuditLogs', ['actorId'], {
      name: 'audit_logs_actor_id'
    });
    console.log('✅ Index created: audit_logs_actor_id');

    await queryInterface.addIndex('AuditLogs', ['action'], {
      name: 'audit_logs_action'
    });
    console.log('✅ Index created: audit_logs_action');

    await queryInterface.addIndex('AuditLogs', ['timestamp'], {
      name: 'audit_logs_timestamp'
    });
    console.log('✅ Index created: audit_logs_timestamp');

    await queryInterface.addIndex('AuditLogs', ['resourceType', 'resourceId'], {
      name: 'audit_logs_resource'
    });
    console.log('✅ Index created: audit_logs_resource');

    // 2. Users index (for role-based queries)
    await queryInterface.addIndex('users', ['role'], {
      name: 'users_role'
    });
    console.log('✅ Index created: users_role');

    await queryInterface.addIndex('users', ['is_active'], {
      name: 'users_is_active'
    });
    console.log('✅ Index created: users_is_active');

    // 3. MedicalRecords indexes (for soft delete queries)
    await queryInterface.addIndex('MedicalRecords', ['deletedAt'], {
      name: 'medical_records_deleted_at'
    });
    console.log('✅ Index created: medical_records_deleted_at');

    await queryInterface.addIndex('MedicalRecords', ['createdAt'], {
      name: 'medical_records_created_at'
    });
    console.log('✅ Index created: medical_records_created_at');

    // 4. AccessRequests indexes (for expiration and time-based queries)
    await queryInterface.addIndex('AccessRequests', ['expiresAt'], {
      name: 'access_requests_expires_at'
    });
    console.log('✅ Index created: access_requests_expires_at');

    await queryInterface.addIndex('AccessRequests', ['createdAt'], {
      name: 'access_requests_created_at'
    });
    console.log('✅ Index created: access_requests_created_at');

    // 5. ShareTokens index (for active token queries)
    await queryInterface.addIndex('ShareTokens', ['isActive'], {
      name: 'share_tokens_is_active'
    });
    console.log('✅ Index created: share_tokens_is_active');

    await queryInterface.addIndex('ShareTokens', ['purpose'], {
      name: 'share_tokens_purpose'
    });
    console.log('✅ Index created: share_tokens_purpose');

    // 6. DoctorProfiles index (for verification status queries)
    await queryInterface.addIndex('DoctorProfiles', ['isVerified'], {
      name: 'doctor_profiles_is_verified'
    });
    console.log('✅ Index created: doctor_profiles_is_verified');

    console.log('🎉 All performance indexes created successfully!');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('📊 Removing performance indexes...');

    // Remove all indexes in reverse order
    await queryInterface.removeIndex('DoctorProfiles', 'doctor_profiles_is_verified');
    await queryInterface.removeIndex('ShareTokens', 'share_tokens_purpose');
    await queryInterface.removeIndex('ShareTokens', 'share_tokens_is_active');
    await queryInterface.removeIndex('AccessRequests', 'access_requests_created_at');
    await queryInterface.removeIndex('AccessRequests', 'access_requests_expires_at');
    await queryInterface.removeIndex('MedicalRecords', 'medical_records_created_at');
    await queryInterface.removeIndex('MedicalRecords', 'medical_records_deleted_at');
    await queryInterface.removeIndex('users', 'users_is_active');
    await queryInterface.removeIndex('users', 'users_role');
    await queryInterface.removeIndex('AuditLogs', 'audit_logs_resource');
    await queryInterface.removeIndex('AuditLogs', 'audit_logs_timestamp');
    await queryInterface.removeIndex('AuditLogs', 'audit_logs_action');
    await queryInterface.removeIndex('AuditLogs', 'audit_logs_actor_id');

    console.log('🎉 All performance indexes removed successfully!');
  }
};