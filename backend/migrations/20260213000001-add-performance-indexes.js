// backend/migrations/20260213000001-add-performance-indexes.js

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('📊 Adding performance indexes...');

    // Helper function to safely add index
    const safeAddIndex = async (tableName, columns, indexName) => {
      try {
        // Check if table and columns exist
        const tableDescription = await queryInterface.describeTable(tableName);
        const columnsArray = Array.isArray(columns) ? columns : [columns];
        
        // Check if all columns exist
        const allColumnsExist = columnsArray.every(col => tableDescription[col]);
        
        if (allColumnsExist) {
          await queryInterface.addIndex(tableName, columns, { name: indexName });
          console.log(`✅ Index created: ${indexName}`);
        } else {
          console.log(`⏭️  Skipped ${indexName} - column(s) don't exist yet`);
        }
      } catch (error) {
        console.log(`⚠️  Could not create index ${indexName}:`, error.message);
      }
    };

    // 1. AuditLogs indexes (for filtering and reporting)
    await safeAddIndex('AuditLogs', ['actorId'], 'audit_logs_actor_id');
    await safeAddIndex('AuditLogs', ['action'], 'audit_logs_action');
    await safeAddIndex('AuditLogs', ['timestamp'], 'audit_logs_timestamp');
    await safeAddIndex('AuditLogs', ['resourceType', 'resourceId'], 'audit_logs_resource');

    // 2. Users indexes (for role-based queries)
    await safeAddIndex('users', ['role'], 'users_role');
    await safeAddIndex('users', ['is_active'], 'users_is_active');

    // 3. MedicalRecords indexes (for soft delete queries)
    await safeAddIndex('MedicalRecords', ['deletedAt'], 'medical_records_deleted_at');
    await safeAddIndex('MedicalRecords', ['createdAt'], 'medical_records_created_at');

    // 4. AccessRequests indexes (for expiration and time-based queries)
    await safeAddIndex('AccessRequests', ['expiresAt'], 'access_requests_expires_at');
    await safeAddIndex('AccessRequests', ['createdAt'], 'access_requests_created_at');

    // 5. ShareTokens indexes (for active token queries)
    await safeAddIndex('ShareTokens', ['isActive'], 'share_tokens_is_active');
    await safeAddIndex('ShareTokens', ['purpose'], 'share_tokens_purpose');

    // 6. DoctorProfiles index (for verification status queries)
    await safeAddIndex('DoctorProfiles', ['isVerified'], 'doctor_profiles_is_verified');

    console.log('🎉 Performance indexes migration completed!');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('📊 Removing performance indexes...');

    const safeRemoveIndex = async (tableName, indexName) => {
      try {
        await queryInterface.removeIndex(tableName, indexName);
        console.log(`✅ Removed index: ${indexName}`);
      } catch (error) {
        console.log(`⏭️  Index ${indexName} doesn't exist or already removed`);
      }
    };

    // Remove all indexes in reverse order
    await safeRemoveIndex('DoctorProfiles', 'doctor_profiles_is_verified');
    await safeRemoveIndex('ShareTokens', 'share_tokens_purpose');
    await safeRemoveIndex('ShareTokens', 'share_tokens_is_active');
    await safeRemoveIndex('AccessRequests', 'access_requests_created_at');
    await safeRemoveIndex('AccessRequests', 'access_requests_expires_at');
    await safeRemoveIndex('MedicalRecords', 'medical_records_created_at');
    await safeRemoveIndex('MedicalRecords', 'medical_records_deleted_at');
    await safeRemoveIndex('users', 'users_is_active');
    await safeRemoveIndex('users', 'users_role');
    await safeRemoveIndex('AuditLogs', 'audit_logs_resource');
    await safeRemoveIndex('AuditLogs', 'audit_logs_timestamp');
    await safeRemoveIndex('AuditLogs', 'audit_logs_action');
    await safeRemoveIndex('AuditLogs', 'audit_logs_actor_id');

    console.log('🎉 All performance indexes removed!');
  }
};