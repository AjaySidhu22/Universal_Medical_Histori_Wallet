// // Import all model definitions
// const User = require('./User');
// const PatientProfile = require('./PatientProfile');
// const DoctorProfile = require('./DoctorProfile');
// const MedicalRecord = require('./MedicalRecord');
// // **NEW IMPORT**
// const ShareToken = require('./ShareToken'); 
// // User-Profile Associations
// User.hasOne(PatientProfile, { foreignKey: 'userId', onDelete: 'CASCADE' });
// PatientProfile.belongsTo(User, { foreignKey: 'userId' });

// User.hasOne(DoctorProfile, { foreignKey: 'userId', onDelete: 'CASCADE' });
// DoctorProfile.belongsTo(User, { foreignKey: 'userId' });

// // Medical Record Associations
// PatientProfile.hasMany(MedicalRecord, { foreignKey: 'patientId', onDelete: 'CASCADE' });
// MedicalRecord.belongsTo(PatientProfile, { foreignKey: 'patientId' });

// DoctorProfile.hasMany(MedicalRecord, { foreignKey: 'doctorId', onDelete: 'SET NULL' });
// MedicalRecord.belongsTo(DoctorProfile, { foreignKey: 'doctorId' });
// // **START: Share Token Associations (MISSING LINES)**
// PatientProfile.hasMany(ShareToken, { foreignKey: 'patientId', onDelete: 'CASCADE' });
// ShareToken.belongsTo(PatientProfile, { foreignKey: 'patientId' });
// // **END: Share Token Associations**
// // We export the sequelize instance and all models for use throughout the application
// module.exports = {
//   sequelize: require('../config/database').sequelize,
//   User,
//   PatientProfile,
//   DoctorProfile,
//   MedicalRecord,
//     // **NEW EXPORT**
//   ShareToken, 
// };


const { sequelize } = require('../config/database');

// 1. Import all model definitions (Must happen first)
const User = require('./User');
const PatientProfile = require('./PatientProfile');
const DoctorProfile = require('./DoctorProfile');
const MedicalRecord = require('./MedicalRecord');
const ShareToken = require('./ShareToken');

// --- 2. Define Associations ---

// A. User <--> Profile (1:1)
// If User is deleted, profile is deleted (CASCADE)
User.hasOne(PatientProfile, { foreignKey: 'userId', onDelete: 'CASCADE' });
PatientProfile.belongsTo(User, { foreignKey: 'userId', as: 'User' }); 
// Allows us to fetch patient.User.email

User.hasOne(DoctorProfile, { foreignKey: 'userId', onDelete: 'CASCADE' });
DoctorProfile.belongsTo(User, { foreignKey: 'userId', as: 'User' }); 
// Allows us to fetch doctor.User.email

// B. Patient Profile <--> Medical Records (1:N)
// If Patient Profile is deleted, all records are deleted (CASCADE)
PatientProfile.hasMany(MedicalRecord, { foreignKey: 'patientId', onDelete: 'CASCADE' });
MedicalRecord.belongsTo(PatientProfile, { foreignKey: 'patientId', as: 'Patient' });

// C. Doctor Profile <--> Medical Records (1:N)
// If Doctor Profile is deleted, doctorId is set to NULL (SET NULL)
DoctorProfile.hasMany(MedicalRecord, { foreignKey: 'doctorId', onDelete: 'SET NULL' });
MedicalRecord.belongsTo(DoctorProfile, { foreignKey: 'doctorId', as: 'DoctorProfile' });

// D. Patient Profile <--> Share Tokens (1:N)
// If Patient Profile is deleted, all share tokens are deleted (CASCADE)
PatientProfile.hasMany(ShareToken, { foreignKey: 'patientId', onDelete: 'CASCADE' });
ShareToken.belongsTo(PatientProfile, { foreignKey: 'patientId', as: 'PatientProfile' });

// --- 3. Export all models and sequelize instance ---
module.exports = {
    sequelize,
    User,
    PatientProfile,
    DoctorProfile,
    MedicalRecord,
    ShareToken,
};