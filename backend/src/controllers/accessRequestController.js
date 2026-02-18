// backend/src/controllers/accessRequestController.js

const { AccessRequest, DoctorProfile, PatientProfile, User } = require('../models');
const logger = require('../utils/logger');
const { 
  sendAccessRequestEmail, 
  sendAccessApprovalEmail, 
  sendAccessDenialEmail 
} = require('../utils/emailService');
const { Op } = require('sequelize');

/**
 * @route   POST /api/access-requests
 * @desc    Doctor requests access to patient records
 * @access  Private (Doctor only)
 */
const createAccessRequest = async (req, res, next) => {
  try {
    const { patientIdentifier, requestType, reason, durationHours } = req.body; // ✅ CHANGED

    // Verify user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can create access requests'
      });
    }

    // Get doctor profile
    const doctorProfile = await DoctorProfile.findOne({
      where: { userId: req.user.id },
      include: [{
        model: User,
        as: 'User',
        attributes: ['email', 'id']
      }]
    });

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    if (!doctorProfile.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your profile must be verified before requesting access to patient records'
      });
    }

    // ✅ NEW: Find patient by username or email
    let patientUser;
    const identifier = patientIdentifier.trim().toLowerCase();
    
    // Remove @ if present (e.g., @john_smith -> john_smith)
    const cleanIdentifier = identifier.startsWith('@') ? identifier.slice(1) : identifier;
    
    // Try to find by username first, then email
    if (cleanIdentifier.includes('@')) {
      // Looks like an email
      patientUser = await User.findOne({
        where: { 
          email: cleanIdentifier,
          role: 'patient'
        }
      });
    } else {
      // Looks like a username
      patientUser = await User.findOne({
        where: { 
          username: cleanIdentifier,
          role: 'patient'
        }
      });
    }

    if (!patientUser) {
      return res.status(404).json({
        success: false,
        message: `Patient not found with identifier: ${patientIdentifier}`
      });
    }

    // Get patient profile
    const patientProfile = await PatientProfile.findOne({
      where: { userId: patientUser.id },
      include: [{
        model: User,
        as: 'User',
        attributes: ['email', 'id', 'username']
      }]
    });

    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found for this user'
      });
    }

    const patientId = patientProfile.id; // ✅ Get the actual patientId

    // Check if there's already a pending or approved request
    const existingRequest = await AccessRequest.findOne({
      where: {
        doctorId: doctorProfile.id,
        patientId: patientId,
        status: {
          [Op.in]: ['pending', 'approved']
        },
        expiresAt: {
          [Op.gt]: new Date()
        }
      }
    });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: existingRequest.status === 'approved'
          ? 'You already have active access to this patient\'s records'
          : 'You already have a pending request for this patient',
        existingRequest
      });
    }

    // Calculate expiration (supports fractional hours now)
    const hours = durationHours || 48;
    const expiresAt = new Date();
    expiresAt.setMilliseconds(expiresAt.getMilliseconds() + (hours * 60 * 60 * 1000));

    // Create access request
    const accessRequest = await AccessRequest.create({
      doctorId: doctorProfile.id,
      patientId: patientId,
      requestType: requestType || 'view',
      reason: reason || 'Medical consultation',
      requestedDuration: hours,
      expiresAt: expiresAt,
      status: 'pending'
    });

    logger.info('Access request created', {
      doctorId: doctorProfile.id,
      patientId: patientId,
      requestId: accessRequest.id
    });

    // 📧 SEND EMAIL TO PATIENT
    try {
      await sendAccessRequestEmail(
        patientProfile.User.email,
        doctorProfile.toJSON(),
        accessRequest.toJSON()
      );
      logger.info('Access request email sent successfully', {
        patientEmail: patientProfile.User.email,
        requestId: accessRequest.id
      });
    } catch (emailError) {
      logger.error('Failed to send access request email (non-critical):', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Access request sent to patient. They have been notified via email.',
      request: accessRequest
    });

  } catch (err) {
    logger.error('Create access request failed:', err);
    next(err);
  }
};

/**
 * @route   GET /api/access-requests/my-requests
 * @desc    Get all access requests (for doctor or patient)
 * @access  Private
 */
const getMyAccessRequests = async (req, res, next) => {
  try {
    // Get pagination params from query
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
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: limit
          }
        });
      }

      // Get total count
      totalCount = await AccessRequest.count({
        where: { doctorId: doctorProfile.id }
      });

      // Get paginated requests
      requests = await AccessRequest.findAll({
        where: { doctorId: doctorProfile.id },
        include: [
          {
            model: PatientProfile,
            as: 'PatientProfile',
            include: [{
              model: User,
              as: 'User',
              attributes: ['email', 'id', 'username']
            }]
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
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: limit
          }
        });
      }

      // Get total count
      totalCount = await AccessRequest.count({
        where: { patientId: patientProfile.id }
      });

      // Get paginated requests
      requests = await AccessRequest.findAll({
        where: { patientId: patientProfile.id },
        include: [
          {
            model: DoctorProfile,
            as: 'DoctorProfile',
            include: [{
              model: User,
              as: 'User',
              attributes: ['email', 'id', 'username']
            }]
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });
    }

    // Calculate total pages
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

/**
 * @route   PUT /api/access-requests/:id/respond
 * @desc    Patient approves or denies access request
 * @access  Private (Patient only)
 */
const respondToAccessRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, customDurationHours } = req.body; // 'approve' or 'deny'

    // Verify user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only patients can respond to access requests' 
      });
    }

    // Get patient profile
    const patientProfile = await PatientProfile.findOne({ 
      where: { userId: req.user.id },
      include: [{
        model: User,
        as: 'User',
        attributes: ['email', 'id']
      }]
    });

    if (!patientProfile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Patient profile not found' 
      });
    }

    // Find the access request
    const accessRequest = await AccessRequest.findByPk(id, {
      include: [
        {
          model: DoctorProfile,
          as: 'DoctorProfile',
          include: [{
            model: User,
            as: 'User',
            attributes: ['email', 'id']
          }]
        }
      ]
    });

    if (!accessRequest) {
      return res.status(404).json({ 
        success: false, 
        message: 'Access request not found' 
      });
    }

    // Verify this request belongs to the patient
    if (accessRequest.patientId !== patientProfile.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'This request does not belong to you' 
      });
    }

    // Check if already responded
    if (accessRequest.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: `This request has already been ${accessRequest.status}` 
      });
    }

    // Check if expired
    if (accessRequest.isExpired()) {
      accessRequest.status = 'expired';
      await accessRequest.save();
      return res.status(400).json({ 
        success: false, 
        message: 'This request has expired' 
      });
    }

      // Update request status
      accessRequest.status = action === 'approve' ? 'approved' : 'denied';
      accessRequest.respondedAt = new Date();
      
      // ✅ FIXED: If approved, ALWAYS recalculate expiration from NOW
      if (action === 'approve') {
        const approvedDuration = customDurationHours || accessRequest.requestedDuration || 48;
        const newExpiresAt = new Date();
        newExpiresAt.setMilliseconds(newExpiresAt.getMilliseconds() + (approvedDuration * 60 * 60 * 1000));
        accessRequest.expiresAt = newExpiresAt;
        accessRequest.approvedDuration = approvedDuration; // Store the approved duration
      }

await accessRequest.save();

    logger.info(`Access request ${action}d`, { 
      requestId: id, 
      patientId: patientProfile.id,
      doctorId: accessRequest.doctorId,
      customDuration: customDurationHours || 'default'
    });

    // 📧 SEND EMAIL TO DOCTOR
    try {
      if (action === 'approve') {
        await sendAccessApprovalEmail(
          accessRequest.DoctorProfile.User.email,
          patientProfile.toJSON(),
          accessRequest.toJSON()
        );
        logger.info('Access approval email sent successfully', { 
          doctorEmail: accessRequest.DoctorProfile.User.email,
          requestId: id 
        });
      } else {
        await sendAccessDenialEmail(
          accessRequest.DoctorProfile.User.email,
          patientProfile.toJSON(),
          accessRequest.toJSON()
        );
        logger.info('Access denial email sent successfully', { 
          doctorEmail: accessRequest.DoctorProfile.User.email,
          requestId: id 
        });
      }
    } catch (emailError) {
      // Log email error but don't fail the request
      logger.error('Failed to send response email (non-critical):', emailError);
    }

    res.json({
      success: true,
      message: `Access request ${action}d successfully. The doctor has been notified via email.`,
      request: accessRequest
    });

  } catch (err) {
    logger.error('Respond to access request failed:', err);
    next(err);
  }
};

/**
 * @route   DELETE /api/access-requests/:id
 * @desc    Doctor cancels their own access request
 * @access  Private (Doctor only)
 */
const cancelAccessRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'doctor') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only doctors can cancel access requests' 
      });
    }

    const doctorProfile = await DoctorProfile.findOne({ 
      where: { userId: req.user.id } 
    });

    if (!doctorProfile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Doctor profile not found' 
      });
    }

    const accessRequest = await AccessRequest.findByPk(id);

    if (!accessRequest) {
      return res.status(404).json({ 
        success: false, 
        message: 'Access request not found' 
      });
    }

    // Verify this request belongs to the doctor
    if (accessRequest.doctorId !== doctorProfile.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'This request does not belong to you' 
      });
    }

    await accessRequest.destroy();

    logger.info('Access request cancelled', { 
      requestId: id, 
      doctorId: doctorProfile.id 
    });

    res.json({
      success: true,
      message: 'Access request cancelled successfully'
    });

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