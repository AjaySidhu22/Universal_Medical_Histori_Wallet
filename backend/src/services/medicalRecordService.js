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
const getAllRecordsForUser = async (user, page = 1, limit = 5) => {
  const offset = (page - 1) * limit;

  if (user.role === 'patient') {
    const patient = await db.PatientProfile.findOne({ where: { userId: user.id } });
    if (!patient) throw { statusCode: 404, message: 'Patient profile not found' };

    const { count, rows } = await db.MedicalRecord.findAndCountAll({
      where: { patientId: patient.id },
      include: [
        {
          model: db.DoctorProfile,
          as: 'DoctorProfile',
          include: [{ model: db.User, as: 'User', attributes: ['email', 'id'] }]
        }
      ],
      order: [['recordDate', 'DESC']],
      limit,
      offset,
      distinct: true
    });

    return { rows, count };
  }

  if (user.role === 'doctor') {
    const doctor = await db.DoctorProfile.findOne({ where: { userId: user.id } });
    if (!doctor) throw { statusCode: 404, message: 'Doctor profile not found' };

    const approvedAccess = await db.AccessRequest.findAll({
      where: {
        doctorId: doctor.id,
        status: 'approved',
        expiresAt: { [Op.gt]: new Date() },
        requestType: { [Op.in]: ['view', 'both'] }
      },
      attributes: ['patientId']
    });

    const approvedPatientIds = approvedAccess.map(req => req.patientId);

    if (approvedPatientIds.length === 0) {
      return { rows: [], count: 0 };
    }

    const { count, rows } = await db.MedicalRecord.findAndCountAll({
      where: { patientId: { [Op.in]: approvedPatientIds } },
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
      order: [['recordDate', 'DESC']],
      limit,
      offset,
      distinct: true
    });

    return { rows, count };
  }

  throw { statusCode: 403, message: 'Access denied' };
};

/**
 * Get a single medical record by ID
 * @param {Object} user - Authenticated user object
 * @param {String} recordId - Record UUID
 * @returns {Promise<Object|null>} Medical record or null
 */
const getMyMedicalRecords = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const { rows, count } = await getAllRecordsForUser(req.user, page, limit);

    const totalPages = Math.ceil(count / limit);

    const recordsWithUrls = await Promise.all(
      rows.map(async (record) => {
        const recordJson = record.toJSON();
        if (recordJson.fileKey) {
          try {
            recordJson.fileUrl = await generateSignedUrl(
              recordJson.fileKey,
              recordJson.fileResourceType || 'image'
            );
          } catch (err) {
            logger.error('Failed to generate signed URL:', err);
            recordJson.fileUrl = null;
          }
        }
        return recordJson;
      })
    );

    res.json({
      data: recordsWithUrls,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        itemsPerPage: limit
      }
    });

  } catch (err) {
    logger.error('Get medical records failed:', err);
    next(err);
  }
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