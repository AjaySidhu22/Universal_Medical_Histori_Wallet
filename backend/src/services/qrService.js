// backend/src/services/qrService.js

const QRCode = require('qrcode');
const crypto = require('crypto');
const db = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Generate a unique share token for QR code
 */
const generateShareToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Create a QR code for emergency access
 * @param {String} patientId - Patient profile UUID
 * @param {Object} options - Duration in hours, access scope, max uses
 * @returns {Promise<Object>} QR code data and URL
 */
const createEmergencyQR = async (patientId, options = {}) => {
  try {
    const {
      durationHours = 24,
      accessScope = 'emergency',
      maxUses = null,
      purpose = 'emergency'
    } = options;

    // Check if patient exists
    const patient = await db.PatientProfile.findByPk(patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    // Deactivate any existing active emergency tokens for this patient
    await db.ShareToken.update(
      { isActive: false },
      {
        where: {
          patientId: patientId,
          purpose: 'emergency',
          isActive: true
        }
      }
    );

    // Generate unique token
    const token = generateShareToken();

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + durationHours);

    // Create share token record
    const shareToken = await db.ShareToken.create({
      patientId,
      token,
      accessScope,
      expiresAt,
      isActive: true,
      maxUses,
      purpose
    });

    // Generate public access URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const shareUrl = `${frontendUrl}/emergency/${token}`;

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(shareUrl, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    logger.info('Emergency QR code created', { 
      patientId, 
      token: token.substring(0, 8) + '...', 
      expiresAt 
    });

    return {
      id: shareToken.id,
      token,
      shareUrl,
      qrCodeDataUrl,
      expiresAt,
      durationHours,
      accessScope,
      isActive: true
    };

  } catch (err) {
    logger.error('Failed to create emergency QR code:', err);
    throw err;
  }
};

/**
 * Verify and use a share token
 * @param {String} token - Share token
 * @returns {Promise<Object>} Patient data and records
 */
const verifyShareToken = async (token) => {
  try {
    const shareToken = await db.ShareToken.findOne({
      where: {
        token,
        isActive: true,
        expiresAt: { [Op.gt]: new Date() }
      },
      include: [
        {
          model: db.PatientProfile,
          as: 'Patient',
          include: [
            {
              model: db.User,
              as: 'User',
              attributes: ['email']
            }
          ]
        }
      ]
    });

    if (!shareToken) {
      return null;
    }

    // Check max uses
    if (shareToken.maxUses && shareToken.usageCount >= shareToken.maxUses) {
      logger.warn('Share token max uses exceeded', { token: token.substring(0, 8) + '...' });
      return null;
    }

    // Increment usage count
    await shareToken.update({
      usageCount: shareToken.usageCount + 1,
      lastAccessedAt: new Date()
    });

    logger.info('Share token verified', { 
      patientId: shareToken.patientId,
      token: token.substring(0, 8) + '...',
      usageCount: shareToken.usageCount + 1
    });

    // Get medical records based on access scope
    const records = await getRecordsByAccessScope(
      shareToken.patientId, 
      shareToken.accessScope
    );

    return {
      patient: shareToken.Patient,
      records,
      accessScope: shareToken.accessScope,
      expiresAt: shareToken.expiresAt,
      usageCount: shareToken.usageCount + 1,
      maxUses: shareToken.maxUses
    };

  } catch (err) {
    logger.error('Failed to verify share token:', err);
    throw err;
  }
};

/**
 * Get records based on access scope
 */
const getRecordsByAccessScope = async (patientId, accessScope) => {
  const baseQuery = {
    where: { patientId },
    include: [
      {
        model: db.DoctorProfile,
        as: 'DoctorProfile',
        include: [
          {
            model: db.User,
            as: 'User',
            attributes: ['email']
          }
        ]
      }
    ],
    order: [['recordDate', 'DESC']]
  };

  if (accessScope === 'summary') {
    // Return only basic info, last 5 records
    baseQuery.limit = 5;
    baseQuery.attributes = ['id', 'title', 'recordDate', 'diagnosis'];
  } else if (accessScope === 'emergency') {
    // Return critical info only
    baseQuery.attributes = {
      exclude: ['notes', 'deletedAt']
    };
  }
  // 'all' scope returns everything (default)

  return await db.MedicalRecord.findAll(baseQuery);
};

/**
 * Revoke a share token
 */
const revokeShareToken = async (tokenId, patientId) => {
  const shareToken = await db.ShareToken.findOne({
    where: {
      id: tokenId,
      patientId: patientId
    }
  });

  if (!shareToken) {
    throw new Error('Share token not found');
  }

  await shareToken.update({ isActive: false });

  logger.info('Share token revoked', { tokenId, patientId });

  return { success: true, message: 'Share token revoked' };
};

/**
 * Get all active share tokens for a patient
 */
const getActiveShareTokens = async (patientId) => {
  return await db.ShareToken.findAll({
    where: {
      patientId,
      isActive: true,
      expiresAt: { [Op.gt]: new Date() }
    },
    order: [['createdAt', 'DESC']]
  });
};

module.exports = {
  createEmergencyQR,
  verifyShareToken,
  revokeShareToken,
  getActiveShareTokens
};