//backend/src/services/profileService.js

const db = require('../models');

/**
 * Create or update patient profile
 * @param {Object} user - Authenticated user object
 * @param {Object} data - Profile data
 * @returns {Promise<Object>} Patient profile
 */
const createPatientProfileService = async (user, data) => {
  if (user.role !== 'patient') {
    throw { statusCode: 403, message: 'Access denied. Only patients can create patient profiles.' };
  }

  // Check if profile already exists
  const existing = await db.PatientProfile.findOne({ where: { userId: user.id } });

  if (existing) {
    // UPDATE existing profile
    const allowedFields = ['dob', 'bloodGroup', 'allergies', 'emergencyContactName', 'emergencyContactNumber'];
    
    // Only update fields that are provided
    Object.keys(data).forEach(key => {
      if (allowedFields.includes(key) && data[key] !== undefined) {
        existing[key] = data[key];
      }
    });

    await existing.save();
    return existing;
  }

  // CREATE new profile
  const profile = await db.PatientProfile.create({
    userId: user.id,
    dob: data.dob || null,
    bloodGroup: data.bloodGroup || null,
    allergies: data.allergies || null,
    emergencyContactName: data.emergencyContactName || null,
    emergencyContactNumber: data.emergencyContactNumber || null,
  });

  return profile;
};

/**
 * Create or update doctor profile
 * @param {Object} user - Authenticated user object
 * @param {Object} data - Profile data
 * @returns {Promise<Object>} Doctor profile
 */
  /**
 * Create or update doctor profile
 * IMPORTANT: Updates to critical fields will reset verification status
 * @param {Object} user - Authenticated user object
 * @param {Object} data - Profile data
 * @returns {Promise<Object>} Doctor profile
 */
const createDoctorProfileService = async (user, data) => {
  if (user.role !== 'doctor') {
    throw { statusCode: 403, message: 'Access denied. Only doctors can create doctor profiles.' };
  }

  // Validate required fields
  if (!data.name || !data.specialty || !data.licenseNumber) {
    throw { 
      statusCode: 400, 
      message: 'Name, specialty, and license number are required for doctor profiles.' 
    };
  }

  // Check if profile already exists
  const existing = await db.DoctorProfile.findOne({ where: { userId: user.id } });

  if (existing) {
    // UPDATE existing profile
    const allowedFields = ['name', 'specialty', 'licenseNumber', 'hospitalAffiliation'];
    
    // Track if critical fields are being changed
    const criticalFields = ['name', 'licenseNumber', 'specialty'];
    let criticalFieldChanged = false;
    let changedFields = [];

    criticalFields.forEach(field => {
      if (data[field] !== undefined && data[field] !== existing[field]) {
        criticalFieldChanged = true;
        changedFields.push(field);
      }
    });

    // Update allowed fields
    Object.keys(data).forEach(key => {
      if (allowedFields.includes(key) && data[key] !== undefined) {
        existing[key] = data[key];
      }
    });

    // If critical field changed, reset verification
    if (criticalFieldChanged && existing.isVerified) {
      existing.isVerified = false;
      await existing.save();
      
      // Return with warning message
      return {
        ...existing.toJSON(),
        verificationWarning: true,
        changedFields: changedFields,
        message: `⚠️ Your profile has been updated, but verification was reset because you changed: ${changedFields.join(', ')}. An admin must re-verify your profile before you can create medical records.`
      };
    }

    await existing.save();
    return existing;
  }

  // CREATE new profile
  const profile = await db.DoctorProfile.create({
    userId: user.id,
    name: data.name,
    specialty: data.specialty,
    licenseNumber: data.licenseNumber,
    hospitalAffiliation: data.hospitalAffiliation || null,
    isVerified: false, // Always starts as unverified
  });

  return profile;
};

/**
 * Get user profile based on role
 * @param {Object} user - Authenticated user object
 * @returns {Promise<Object|null>} User profile
 */
const getUserProfileService = async (user) => {
  if (user.role === 'patient') {
    return await db.PatientProfile.findOne({ 
      where: { userId: user.id },
      include: [{
        model: db.User,
        as: 'User',
        attributes: ['email', 'id', 'role']
      }]
    });
  }

  if (user.role === 'doctor') {
    return await db.DoctorProfile.findOne({ 
      where: { userId: user.id },
      include: [{
        model: db.User,
        as: 'User',
        attributes: ['email', 'id', 'role']
      }]
    });
  }

  return null;
};

module.exports = {
  createPatientProfileService,
  createDoctorProfileService,
  getUserProfileService
};