//  backend/src/services/medicalRecordService.js

const db = require('../models');
const { Op } = require('sequelize');

const RECORD_ATTRIBUTES = [
  'id', 'title', 'diagnosis', 'prescription', 'notes', 'description',
  'recordDate', 'fileKey', 'fileName', 'fileType', 'fileSize',
  'fileResourceType', 'patientId', 'doctorId'
];

const DOCTOR_ATTRIBUTES = ['id', 'name', 'specialty', 'userId'];
const PATIENT_ATTRIBUTES = ['id', 'userId'];

const createMedicalRecordService = async (user, data) => {
  let patientId = null;
  let doctorId = null;

  if (user.role === 'patient') {
    const patient = await db.PatientProfile.findOne({ where: { userId: user.id } });
    if (!patient) throw { statusCode: 404, message: 'Patient profile not found. Please complete your profile first.' };
    patientId = patient.id;

  } else if (user.role === 'doctor') {
    const doctor = await db.DoctorProfile.findOne({ where: { userId: user.id } });
    if (!doctor) throw { statusCode: 404, message: 'Doctor profile not found. Please complete your profile first.' };
    if (!doctor.isVerified) throw { statusCode: 403, message: '⏳ Doctor not verified. Please wait for admin approval.' };

    doctorId = doctor.id;
    patientId = data.patientId;

    if (!patientId) throw { statusCode: 400, message: 'Patient ID required' };

    const patient = await db.PatientProfile.findByPk(patientId);
    if (!patient) throw { statusCode: 404, message: 'Patient not found' };

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

  const record = await db.MedicalRecord.create({
    patientId,
    doctorId,
    title: data.title,
    description: data.description,
    diagnosis: data.diagnosis,
    prescription: data.prescription,
    notes: data.notes,
    recordDate: data.recordDate || new Date().toISOString().split('T')[0],
    fileKey: data.fileKey || null,
    fileType: data.fileType || null,
    fileName: data.fileName || null,
    fileSize: data.fileSize || null,
    fileResourceType: data.fileResourceType || null
  });

  const fullRecord = await db.MedicalRecord.findByPk(record.id, {
    attributes: RECORD_ATTRIBUTES,
    include: [
      {
        model: db.DoctorProfile,
        as: 'DoctorProfile',
        attributes: DOCTOR_ATTRIBUTES,
        include: [{ model: db.User, as: 'User', attributes: ['email'] }]
      },
      {
        model: db.PatientProfile,
        as: 'Patient',
        attributes: PATIENT_ATTRIBUTES,
        include: [{ model: db.User, as: 'User', attributes: ['email'] }]
      }
    ]
  });

  return fullRecord;
};

const getAllRecordsForUser = async (user, page = 1, limit = 5) => {
  const offset = (page - 1) * limit;

  if (user.role === 'patient') {
    const patient = await db.PatientProfile.findOne({ where: { userId: user.id } });
    if (!patient) throw { statusCode: 404, message: 'Patient profile not found' };

    const { count, rows } = await db.MedicalRecord.findAndCountAll({
      where: { patientId: patient.id },
      attributes: RECORD_ATTRIBUTES,
      include: [
        {
          model: db.DoctorProfile,
          as: 'DoctorProfile',
          attributes: DOCTOR_ATTRIBUTES,
          include: [{ model: db.User, as: 'User', attributes: ['email'] }]
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
      attributes: RECORD_ATTRIBUTES,
      include: [
        {
          model: db.PatientProfile,
          as: 'Patient',
          attributes: PATIENT_ATTRIBUTES,
          include: [{ model: db.User, as: 'User', attributes: ['email'] }]
        },
        {
          model: db.DoctorProfile,
          as: 'DoctorProfile',
          attributes: DOCTOR_ATTRIBUTES,
          include: [{ model: db.User, as: 'User', attributes: ['email'] }]
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

const getMedicalRecordById = async (user, recordId) => {
  const record = await db.MedicalRecord.findByPk(recordId, {
    attributes: RECORD_ATTRIBUTES,
    include: [
      {
        model: db.DoctorProfile,
        as: 'DoctorProfile',
        attributes: DOCTOR_ATTRIBUTES,
        include: [{ model: db.User, as: 'User', attributes: ['email'] }]
      },
      {
        model: db.PatientProfile,
        as: 'Patient',
        attributes: PATIENT_ATTRIBUTES,
        include: [{ model: db.User, as: 'User', attributes: ['email'] }]
      }
    ]
  });

  if (!record) return null;

  if (user.role === 'patient') {
    const patient = await db.PatientProfile.findOne({ where: { userId: user.id } });
    return record.patientId === patient?.id ? record : null;
  }

  if (user.role === 'doctor') {
    const doctor = await db.DoctorProfile.findOne({ where: { userId: user.id } });
    const hasAccess = await checkDoctorAccess(doctor.id, record.patientId, 'view');
    return hasAccess ? record : null;
  }

  if (user.role === 'admin') return record;

  return null;
};

async function checkDoctorAccess(doctorId, patientId, accessType) {
  const approvedRequest = await db.AccessRequest.findOne({
    where: {
      doctorId,
      patientId,
      status: 'approved',
      expiresAt: { [Op.gt]: new Date() }
    }
  });

  if (!approvedRequest) return false;

  if (accessType === 'view') return ['view', 'both'].includes(approvedRequest.requestType);
  if (accessType === 'create') return ['create', 'both'].includes(approvedRequest.requestType);

  return false;
}

module.exports = {
  createMedicalRecordService,
  getAllRecordsForUser,
  getMedicalRecordById
};