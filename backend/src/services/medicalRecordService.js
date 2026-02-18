//  backend/src/services/medicalRecordService.js

const db = require('../models');
const { Op } = require('sequelize');

/**
 * Create a medical record
 * @param {Object} user - Authenticated user object
 * @param {Object} data - Record data
 * @returns {Promise<Object>} Created record with associations
 */
const createMedicalRecordService = async (user, data) => {
  let patientId = null;
  let doctorId = null;

  if (user.role === 'patient') {
    // Patient creating their own record
    const patient = await db.PatientProfile.findOne({ where: { userId: user.id } });
    if (!patient) throw { statusCode: 404, message: 'Patient profile not found. Please complete your profile first.' };
    patientId = patient.id;

  } else if (user.role === 'doctor') {
    // Doctor creating record for a patient
    const doctor = await db.DoctorProfile.findOne({ where: { userId: user.id } });
    
    if (!doctor) throw { statusCode: 404, message: 'Doctor profile not found. Please complete your profile first.' };
    if (!doctor.isVerified) throw { statusCode: 403, message: '⏳ Doctor not verified. Please wait for admin approval.' };

    doctorId = doctor.id;
    patientId = data.patientId;

    if (!patientId) throw { statusCode: 400, message: 'Patient ID required' };

    // Verify patient exists
    const patient = await db.PatientProfile.findByPk(patientId);
    if (!patient) throw { statusCode: 404, message: 'Patient not found' };

    // 🔒 CRITICAL: Check if doctor has approved access to create records
    const hasAccess = await checkDoctorAccess(doctorId, patientId, 'create');
    if (!hasAccess) {
      throw { 
        statusCode: 403, 
        message: '🔒 Access denied. You must request and receive patient approval before creating records for this patient.' 
      };
    }

  } else {
    throw { statusCode: 403, message: 'Only patients or verified doctors can create records' };
  }
  // Create the record
const record = await db.MedicalRecord.create({
  patientId,
  doctorId,
  title: data.title,
  description: data.description,
  diagnosis: data.diagnosis,
  prescription: data.prescription,
  notes: data.notes,
  recordDate: data.recordDate || new Date().toISOString().split('T')[0],
  // File fields (if file was uploaded)
  fileKey: data.fileKey || null,
  fileType: data.fileType || null,
  fileName: data.fileName || null,
  fileSize: data.fileSize || null
});

  // Fetch the created record with associations
  const fullRecord = await db.MedicalRecord.findByPk(record.id, {
    include: [
      { 
        model: db.DoctorProfile, 
        as: 'DoctorProfile',
        include: [{ model: db.User, as: 'User', attributes: ['email'] }]
      },
      { 
        model: db.PatientProfile, 
        as: 'Patient',
        include: [{ model: db.User, as: 'User', attributes: ['email'] }]
      }
    ]
  });

  return fullRecord;
};

/**
 * Get all medical records for the authenticated user
 * @param {Object} user - Authenticated user object
 * @returns {Promise<Array>} Array of medical records
 */
const getAllRecordsForUser = async (user) => {
  if (user.role === 'patient') {
    const patient = await db.PatientProfile.findOne({ where: { userId: user.id } });
    
    if (!patient) {
      throw { statusCode: 404, message: 'Patient profile not found' };
    }

    return await db.MedicalRecord.findAll({ 
      where: { patientId: patient.id },
      include: [
        { 
          model: db.DoctorProfile, 
          as: 'DoctorProfile',
          include: [{ model: db.User, as: 'User', attributes: ['email', 'id'] }]
        }
      ],
      order: [['recordDate', 'DESC']]
    });
  }

  if (user.role === 'doctor') {
    const doctor = await db.DoctorProfile.findOne({ where: { userId: user.id } });
    
    if (!doctor) {
      throw { statusCode: 404, message: 'Doctor profile not found' };
    }

    // 🔒 STRICTEST CONTROL: Doctor can ONLY see records for patients with APPROVED access
    // Even if the doctor created the record, they need patient permission to view it
    
    // Get all approved access requests for this doctor
    const approvedAccess = await db.AccessRequest.findAll({
      where: {
        doctorId: doctor.id,
        status: 'approved',
        expiresAt: { [Op.gt]: new Date() }, // Not expired
        requestType: { [Op.in]: ['view', 'both'] } // Must have view permission
      },
      attributes: ['patientId']
    });

    const approvedPatientIds = approvedAccess.map(req => req.patientId);

    // If no approved access, return empty array
    if (approvedPatientIds.length === 0) {
      return [];
    }

    // Return records ONLY for patients with approved access
    return await db.MedicalRecord.findAll({ 
      where: {
        patientId: { [Op.in]: approvedPatientIds }
      },
      include: [
        { 
          model: db.PatientProfile, 
          as: 'Patient',
          include: [{ model: db.User, as: 'User', attributes: ['email', 'id'] }]
        },
        { 
          model: db.DoctorProfile, 
          as: 'DoctorProfile',
          include: [{ model: db.User, as: 'User', attributes: ['email', 'id'] }]
        }
      ],
      order: [['recordDate', 'DESC']]
    });
  }

  throw { statusCode: 403, message: 'Access denied' };
};

/**
 * Get a single medical record by ID
 * @param {Object} user - Authenticated user object
 * @param {String} recordId - Record UUID
 * @returns {Promise<Object|null>} Medical record or null
 */
const getMedicalRecordById = async (user, recordId) => {
  const record = await db.MedicalRecord.findByPk(recordId, {
    include: [
      { 
        model: db.DoctorProfile, 
        as: 'DoctorProfile',
        include: [{ model: db.User, as: 'User', attributes: ['email', 'id'] }]
      },
      { 
        model: db.PatientProfile, 
        as: 'Patient',
        include: [{ model: db.User, as: 'User', attributes: ['email', 'id'] }]
      }
    ]
  });

  if (!record) {
    return null;
  }

  // Check access permissions
  if (user.role === 'patient') {
    const patient = await db.PatientProfile.findOne({ where: { userId: user.id } });
    return record.patientId === patient?.id ? record : null;
  }

  if (user.role === 'doctor') {
    const doctor = await db.DoctorProfile.findOne({ where: { userId: user.id } });
    
    // 🔒 STRICT: Doctor needs approved access even for records they created
    const hasAccess = await checkDoctorAccess(doctor.id, record.patientId, 'view');
    return hasAccess ? record : null;
  }

  if (user.role === 'admin') {
    return record; // Admin can view all records
  }

  return null;
};

/**
 * Helper function to check if doctor has access to patient
 * @param {String} doctorId - Doctor profile UUID
 * @param {String} patientId - Patient profile UUID
 * @param {String} accessType - 'view' or 'create'
 * @returns {Promise<Boolean>} Has access
 */
async function checkDoctorAccess(doctorId, patientId, accessType) {
  const approvedRequest = await db.AccessRequest.findOne({
    where: {
      doctorId: doctorId,
      patientId: patientId,
      status: 'approved',
      expiresAt: { [Op.gt]: new Date() } // Not expired
    }
  });

  if (!approvedRequest) {
    return false;
  }

  // Check if request type allows this access
  if (accessType === 'view') {
    return ['view', 'both'].includes(approvedRequest.requestType);
  }

  if (accessType === 'create') {
    return ['create', 'both'].includes(approvedRequest.requestType);
  }

  return false;
}

module.exports = {
  createMedicalRecordService,
  getAllRecordsForUser,
  getMedicalRecordById
};