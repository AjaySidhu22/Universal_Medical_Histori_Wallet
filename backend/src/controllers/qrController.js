// backend/src/controllers/qrController.js

const { 
  createEmergencyQR, 
  verifyShareToken, 
  revokeShareToken,
  getActiveShareTokens 
} = require('../services/qrService');
const logger = require('../utils/logger');

/**
 * @route   POST /api/qr/generate
 * @desc    Generate emergency QR code for patient
 * @access  Private (Patient only)
 */
const generateEmergencyQR = async (req, res, next) => {
  try {
    // Only patients can generate their own QR codes
    if (req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Only patients can generate emergency QR codes'
      });
    }

    const { durationHours = 24, accessScope = 'emergency', maxUses = null } = req.body;

    // Validate duration (1 hour to 168 hours / 7 days)
    if (durationHours < 1 || durationHours > 168) {
      return res.status(400).json({
        success: false,
        message: 'Duration must be between 1 and 168 hours (7 days)'
      });
    }

    // Get patient profile
    const db = require('../models');
    const patient = await db.PatientProfile.findOne({ 
      where: { userId: req.user.id } 
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    // Generate QR code
    const qrData = await createEmergencyQR(patient.id, {
      durationHours,
      accessScope,
      maxUses,
      purpose: 'emergency'
    });

    logger.info('Emergency QR generated', { 
      userId: req.user.id, 
      patientId: patient.id,
      durationHours 
    });

    res.status(201).json({
      success: true,
      message: 'Emergency QR code generated successfully',
      data: qrData
    });

  } catch (err) {
    logger.error('Generate emergency QR failed:', err);
    next(err);
  }
};

/**
 * @route   GET /api/qr/my-codes
 * @desc    Get all active QR codes for current patient
 * @access  Private (Patient only)
 */
const getMyQRCodes = async (req, res, next) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Only patients can view their QR codes'
      });
    }

    const db = require('../models');
    const patient = await db.PatientProfile.findOne({ 
      where: { userId: req.user.id } 
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    const tokens = await getActiveShareTokens(patient.id);

    res.json({
      success: true,
      count: tokens.length,
      data: tokens
    });

  } catch (err) {
    logger.error('Get QR codes failed:', err);
    next(err);
  }
};

/**
 * @route   DELETE /api/qr/:id
 * @desc    Revoke a share token
 * @access  Private (Patient only)
 */
const revokeQRCode = async (req, res, next) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Only patients can revoke their QR codes'
      });
    }

    const db = require('../models');
    const patient = await db.PatientProfile.findOne({ 
      where: { userId: req.user.id } 
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    const result = await revokeShareToken(req.params.id, patient.id);

    logger.info('QR code revoked', { 
      userId: req.user.id, 
      tokenId: req.params.id 
    });

    res.json(result);

  } catch (err) {
    logger.error('Revoke QR code failed:', err);
    next(err);
  }
};

/**
 * @route   GET /api/qr/public/:token
 * @desc    Access medical records via share token (NO AUTH REQUIRED)
 * @access  Public
 */
const accessViaToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    const data = await verifyShareToken(token);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    logger.info('Public access via token', { 
      patientId: data.patient.id,
      token: token.substring(0, 8) + '...' 
    });

    res.json({
      success: true,
      message: 'Access granted',
      data: {
        patient: {
          email: data.patient.User?.email,
          dob: data.patient.dob,
          bloodGroup: data.patient.bloodGroup,
          allergies: data.patient.allergies,
          emergencyContactName: data.patient.emergencyContactName,
          emergencyContactNumber: data.patient.emergencyContactNumber
        },
        records: data.records,
        accessInfo: {
          scope: data.accessScope,
          expiresAt: data.expiresAt,
          usageCount: data.usageCount,
          maxUses: data.maxUses
        }
      }
    });

  } catch (err) {
    logger.error('Access via token failed:', err);
    next(err);
  }
};

module.exports = {
  generateEmergencyQR,
  getMyQRCodes,
  revokeQRCode,
  accessViaToken
};