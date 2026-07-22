// backend/src/controllers/accessRequestController.js

const { AccessRequest, DoctorProfile, PatientProfile, User } = require('../models');
const logger = require('../utils/logger');
const {
  sendAccessRequestEmail,
  sendAccessApprovalEmail,
  sendAccessDenialEmail
} = require('../utils/emailService');
const { Op } = require('sequelize');

// Field restrictions
const ACCESS_REQUEST_ATTRIBUTES = [
  'id', 'requestType', 'status', 'reason', 'requestedDuration',
  'approvedDuration', 'expiresAt', 'respondedAt', 'createdAt'
];

const DOCTOR_ATTRIBUTES = ['id', 'name', 'specialty'];
const PATIENT_ATTRIBUTES = ['id'];
const USER_ATTRIBUTES = ['email', 'username'];

const createAccessRequest = async (req, res, next) => {
  try {
    const { patientIdentifier, requestType, reason, durationHours } = req.body;

    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can create access requests'
      });
    }

    const doctorProfile = await DoctorProfile.findOne({
      where: { userId: req.user.id },
      include: [{ model: User, as: 'User', attributes: ['email'] }]
    });

    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    if (!doctorProfile.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your profile must be verified before requesting access to patient records'
      });
    }

    const identifier = patientIdentifier.trim().toLowerCase();
    const cleanIdentifier = identifier.startsWith('@') ? identifier.slice(1) : identifier;

    let patientUser;
    if (cleanIdentifier.includes('@')) {
      patientUser = await User.findOne({ where: { email: cleanIdentifier, role: 'patient' } });
    } else {
      patientUser = await User.findOne({ where: { username: cleanIdentifier, role: 'patient' } });
    }

    if (!patientUser) {
      return res.status(404).json({
        success: false,
        message: `Patient not found with identifier: ${patientIdentifier}`
      });
    }

    const patientProfile = await PatientProfile.findOne({
      where: { userId: patientUser.id },
      include: [{ model: User, as: 'User', attributes: ['email'] }]
    });

    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found for this user'
      });
    }

    const patientId = patientProfile.id;

    const existingRequest = await AccessRequest.findOne({
      where: {
        doctorId: doctorProfile.id,
        patientId,
        status: { [Op.in]: ['pending', 'approved'] },
        expiresAt: { [Op.gt]: new Date() }
      }
    });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: existingRequest.status === 'approved'
          ? 'You already have active access to this patient\'s records'
          : 'You already have a pending request for this patient'
      });
    }

    const hours = durationHours || 48;
    const expiresAt = new Date();
    expiresAt.setMilliseconds(expiresAt.getMilliseconds() + (hours * 60 * 60 * 1000));

    const accessRequest = await AccessRequest.create({
      doctorId: doctorProfile.id,
      patientId,
      requestType: requestType || 'view',
      reason: reason || 'Medical consultation',
      requestedDuration: hours,
      expiresAt,
      status: 'pending'
    });

    logger.info('Access request created', {
      doctorId: doctorProfile.id,
      patientId,
      requestId: accessRequest.id
    });

    try {
      await sendAccessRequestEmail(
        patientProfile.User.email,
        doctorProfile.toJSON(),
        accessRequest.toJSON()
      );
    } catch (emailError) {
      logger.error('Failed to send access request email (non-critical):', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Access request sent to patient. They have been notified via email.',
      request: {
        id: accessRequest.id,
        requestType: accessRequest.requestType,
        status: accessRequest.status,
        requestedDuration: accessRequest.requestedDuration,
        expiresAt: accessRequest.expiresAt
      }
    });

  } catch (err) {
    logger.error('Create access request failed:', err);
    next(err);
  }
};

const getMyAccessRequests = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    let requests = [];
    let totalCount = 0;

    if (req.user.role === 'doctor') {
      const doctorProfile = await DoctorProfile.findOne({
        where: { userId: req.user.id }
      });

      if (!doctorProfile) {
        return res.json({
          data: [],
          pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: limit }
        });
      }

      totalCount = await AccessRequest.count({
        where: { doctorId: doctorProfile.id }
      });

      requests = await AccessRequest.findAll({
        where: { doctorId: doctorProfile.id },
        attributes: ACCESS_REQUEST_ATTRIBUTES,
        include: [
          {
            model: PatientProfile,
            as: 'PatientProfile',
            attributes: PATIENT_ATTRIBUTES,
            include: [{ model: User, as: 'User', attributes: USER_ATTRIBUTES }]
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

    } else if (req.user.role === 'patient') {
      const patientProfile = await PatientProfile.findOne({
        where: { userId: req.user.id }
      });

      if (!patientProfile) {
        return res.json({
          data: [],
          pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: limit }
        });
      }

      totalCount = await AccessRequest.count({
        where: { patientId: patientProfile.id }
      });

      requests = await AccessRequest.findAll({
        where: { patientId: patientProfile.id },
        attributes: ACCESS_REQUEST_ATTRIBUTES,
        include: [
          {
            model: DoctorProfile,
            as: 'DoctorProfile',
            attributes: DOCTOR_ATTRIBUTES,
            include: [{ model: User, as: 'User', attributes: USER_ATTRIBUTES }]
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });
    }

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      data: requests,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit
      }
    });

  } catch (err) {
    logger.error('Get access requests failed:', err);
    next(err);
  }
};

const respondToAccessRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, customDurationHours } = req.body;

    if (req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Only patients can respond to access requests'
      });
    }

    const patientProfile = await PatientProfile.findOne({
      where: { userId: req.user.id },
      include: [{ model: User, as: 'User', attributes: ['email'] }]
    });

    if (!patientProfile) {
      return res.status(404).json({ success: false, message: 'Patient profile not found' });
    }

    const accessRequest = await AccessRequest.findByPk(id, {
      include: [
        {
          model: DoctorProfile,
          as: 'DoctorProfile',
          attributes: DOCTOR_ATTRIBUTES,
          include: [{ model: User, as: 'User', attributes: ['email'] }]
        }
      ]
    });

    if (!accessRequest) {
      return res.status(404).json({ success: false, message: 'Access request not found' });
    }

    if (accessRequest.patientId !== patientProfile.id) {
      return res.status(403).json({ success: false, message: 'This request does not belong to you' });
    }

    if (accessRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This request has already been ${accessRequest.status}`
      });
    }

    if (accessRequest.isExpired()) {
      accessRequest.status = 'expired';
      await accessRequest.save();
      return res.status(400).json({ success: false, message: 'This request has expired' });
    }

    accessRequest.status = action === 'approve' ? 'approved' : 'denied';
    accessRequest.respondedAt = new Date();

    if (action === 'approve') {
      const approvedDuration = customDurationHours || accessRequest.requestedDuration || 48;
      const newExpiresAt = new Date();
      newExpiresAt.setMilliseconds(newExpiresAt.getMilliseconds() + (approvedDuration * 60 * 60 * 1000));
      accessRequest.expiresAt = newExpiresAt;
      accessRequest.approvedDuration = approvedDuration;
    }

    await accessRequest.save();

    logger.info(`Access request ${action}d`, {
      requestId: id,
      patientId: patientProfile.id,
      doctorId: accessRequest.doctorId
    });

    try {
      if (action === 'approve') {
        await sendAccessApprovalEmail(
          accessRequest.DoctorProfile.User.email,
          patientProfile.toJSON(),
          accessRequest.toJSON()
        );
      } else {
        await sendAccessDenialEmail(
          accessRequest.DoctorProfile.User.email,
          patientProfile.toJSON(),
          accessRequest.toJSON()
        );
      }
    } catch (emailError) {
      logger.error('Failed to send response email (non-critical):', emailError);
    }

    res.json({
      success: true,
      message: `Access request ${action}d successfully. The doctor has been notified via email.`,
      request: {
        id: accessRequest.id,
        status: accessRequest.status,
        expiresAt: accessRequest.expiresAt,
        respondedAt: accessRequest.respondedAt
      }
    });

  } catch (err) {
    logger.error('Respond to access request failed:', err);
    next(err);
  }
};

const cancelAccessRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Only doctors can cancel access requests' });
    }

    const doctorProfile = await DoctorProfile.findOne({ where: { userId: req.user.id } });

    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    const accessRequest = await AccessRequest.findByPk(id);

    if (!accessRequest) {
      return res.status(404).json({ success: false, message: 'Access request not found' });
    }

    if (accessRequest.doctorId !== doctorProfile.id) {
      return res.status(403).json({ success: false, message: 'This request does not belong to you' });
    }

    await accessRequest.destroy();

    logger.info('Access request cancelled', { requestId: id, doctorId: doctorProfile.id });

    res.json({ success: true, message: 'Access request cancelled successfully' });

  } catch (err) {
    logger.error('Cancel access request failed:', err);
    next(err);
  }
};

module.exports = {
  createAccessRequest,
  getMyAccessRequests,
  respondToAccessRequest,
  cancelAccessRequest
};