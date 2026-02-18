// \backend\src\controllers\shareController.js
 
const { PatientProfile, ShareToken, MedicalRecord, DoctorProfile, User } = require('../models');
const crypto = require('crypto');

// ==============================================
// HELPER FUNCTIONS
// ==============================================

/**
 * Calculate expiration date based on duration string (e.g., '7d', '1h')
 */
const calculateExpiry = (duration) => {
  const value = parseInt(duration);
  const unit = duration.slice(-1); // 'd' or 'h'
  let expiry = new Date();

  // Default to 7 days if duration is invalid
  if (isNaN(value) || !['d', 'h'].includes(unit)) {
    expiry.setDate(expiry.getDate() + 7);
    return expiry;
  }

  if (unit === 'd') {
    expiry.setDate(expiry.getDate() + value);
  } else if (unit === 'h') {
    expiry.setHours(expiry.getHours() + value);
  }

  return expiry;
};

// ==============================================
// CONTROLLER FUNCTIONS
// ==============================================

/**
 * @route   POST /api/share
 * @desc    Patient generates a share token for their medical records
 * @access  Private (Patient only)
 */
const generateShareToken = async (req, res, next) => {
  try {
    const { duration, sharedWithEmail, accessScope = 'full' } = req.body;
    const currentUserId = req.user.id;

    // 1. Check if user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only patients can generate share tokens.' 
      });
    }

    // 2. Get patient profile
    const patientProfile = await PatientProfile.findOne({ 
      where: { userId: currentUserId } 
    });

    if (!patientProfile) {
      return res.status(403).json({ 
        success: false, 
        message: 'Complete your patient profile before sharing records.' 
      });
    }

    // 3. Validate access scope
    const validScopes = ['full', 'basic', 'records_only', 'allergies_only'];
    if (!validScopes.includes(accessScope)) {
      return res.status(400).json({
        success: false,
        message: `Invalid access scope. Must be one of: ${validScopes.join(', ')}`
      });
    }

    // 4. Generate token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = calculateExpiry(duration);

    // 5. Save to database
    await ShareToken.create({
      token: tokenHash,
      patientId: patientProfile.id,
      expiresAt: expiresAt,
      sharedWithEmail: sharedWithEmail || null,
      accessScope: accessScope,
      usageLimit: 999, // Set high limit for now
      usageCount: 0
    });

    // 6. Return the raw token to client
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.status(201).json({
      success: true,
      message: 'Share link generated successfully.',
      shareUrl: `${frontendUrl}/share/view?token=${rawToken}`,
      rawToken: rawToken,
      expiresAt: expiresAt,
      accessScope: accessScope
    });

  } catch (err) {
    console.error('Generate token error:', err);
    next(err);
  }
};

/**
 * @route   GET /api/share/:token
 * @desc    Retrieve patient records using a valid share token (Public)
 * @access  Public
 */
const getRecordsByShareToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    // 1. Hash the token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // 2. Find and validate token
    const shareToken = await ShareToken.findOne({ 
      where: { token: tokenHash } 
    });

    if (!shareToken) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid share token.' 
      });
    }

    // 3. Check expiration
    if (shareToken.isExpired()) {
      return res.status(401).json({ 
        success: false, 
        message: 'Share token has expired.' 
      });
    }

    // 4. Check usage limit
    if (shareToken.hasReachedLimit()) {
      return res.status(401).json({
        success: false,
        message: 'Share token usage limit reached.'
      });
    }

    // 5. Increment usage count
    shareToken.usageCount += 1;
    await shareToken.save();

    const accessScope = shareToken.accessScope;

    // 6. Get patient profile
    const patientProfile = await PatientProfile.findByPk(shareToken.patientId, {
      include: [{ 
        model: User, 
        as: 'User', 
        attributes: ['email', 'id'] 
      }],
      attributes: ['id', 'dob', 'bloodGroup', 'allergies', 'emergencyContactName', 'emergencyContactNumber']
    });

    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found.'
      });
    }

    // 7. Get medical records based on scope
    let records = [];
    if (['full', 'records_only'].includes(accessScope)) {
      records = await MedicalRecord.findAll({
        where: { patientId: shareToken.patientId },
        include: [
          {
            model: DoctorProfile,
            as: 'DoctorProfile', // FIXED: Use correct alias
            attributes: ['id', 'name', 'specialty', 'licenseNumber'],
            include: [{ 
              model: User, 
              as: 'User', 
              attributes: ['email'] 
            }]
          }
        ],
        attributes: ['id', 'title', 'description', 'diagnosis', 'prescription', 'notes', 'recordDate', 'fileKey', 'fileType'],
        order: [['recordDate', 'DESC']]
      });
    }

    // 8. Filter patient data based on scope
    let filteredPatientData = { 
      User: patientProfile.User,
      id: patientProfile.id
    };

    if (['full', 'basic'].includes(accessScope)) {
      filteredPatientData.dob = patientProfile.dob;
      filteredPatientData.bloodGroup = patientProfile.bloodGroup;
      filteredPatientData.emergencyContactName = patientProfile.emergencyContactName;
      filteredPatientData.emergencyContactNumber = patientProfile.emergencyContactNumber;
    }

    if (['full', 'allergies_only'].includes(accessScope)) {
      filteredPatientData.allergies = patientProfile.allergies;
    }

    // 9. Return response
    res.json({
      success: true,
      accessScope: accessScope,
      patient: filteredPatientData,
      records: records
    });

  } catch (err) {
    console.error('Shared record fetch error:', err);
    next(err);
  }
};

/**
 * @route   GET /api/share/manage
 * @desc    Patient lists all their active share tokens
 * @access  Private (Patient only)
 */
const listShareTokens = async (req, res, next) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only patients can manage share tokens.' 
      });
    }

    // 1. Get patient profile
    const patientProfile = await PatientProfile.findOne({ 
      where: { userId: req.user.id } 
    });

    if (!patientProfile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Patient profile not found.' 
      });
    }

    // 2. Get all tokens for this patient
    const activeTokens = await ShareToken.findAll({
      where: { 
        patientId: patientProfile.id
      },
      attributes: ['id', 'expiresAt', 'sharedWithEmail', 'createdAt', 'accessScope', 'usageCount', 'usageLimit'],
      order: [['createdAt', 'DESC']]
    });

    res.json({ 
      success: true, 
      tokens: activeTokens 
    });

  } catch (err) {
    next(err);
  }
};

/**
 * @route   DELETE /api/share/manage/:tokenId
 * @desc    Patient revokes a share token
 * @access  Private (Patient only)
 */
const revokeShareToken = async (req, res, next) => {
  try {
    const { tokenId } = req.params;

    if (req.user.role !== 'patient') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied.' 
      });
    }

    // 1. Get patient profile
    const patientProfile = await PatientProfile.findOne({ 
      where: { userId: req.user.id } 
    });

    if (!patientProfile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Patient profile not found.' 
      });
    }

    // 2. Delete token (with security check)
    const deletedCount = await ShareToken.destroy({
      where: {
        id: tokenId,
        patientId: patientProfile.id // Ensure patient owns this token
      }
    });

    if (deletedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Token not found or unauthorized.' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Share token successfully revoked.' 
    });

  } catch (err) {
    next(err);
  }
};

module.exports = {
  generateShareToken,
  getRecordsByShareToken,
  listShareTokens,
  revokeShareToken
};