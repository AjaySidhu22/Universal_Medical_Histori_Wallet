// backend/src/routes/qrRoutes.js

const express = require('express');
const router = express.Router();
const { qrLimiter } = require('../middlewares/security');
const { body } = require('express-validator');
const validate = require('../middlewares/validateMiddleware');
const { protect } = require('../middlewares/authMiddleware');
const {
  generateEmergencyQR,
  getMyQRCodes,
  revokeQRCode,
  accessViaToken
} = require('../controllers/qrController');

/**
 * @route   POST /api/qr/generate
 * @desc    Generate emergency QR code
 * @access  Private (Patient)
 */
router.post(
  '/generate',
  qrLimiter,
  protect,
  [
    body('durationHours')
      .optional()
      .isInt({ min: 1, max: 168 })
      .withMessage('Duration must be between 1 and 168 hours'),
    body('accessScope')
      .optional()
      .isIn(['all', 'summary', 'emergency'])
      .withMessage('Access scope must be: all, summary, or emergency'),
    body('maxUses')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Max uses must be a positive integer')
  ],
  validate,
  generateEmergencyQR
);

/**
 * @route   GET /api/qr/my-codes
 * @desc    Get all active QR codes for patient
 * @access  Private (Patient)
 */
router.get('/my-codes', protect, getMyQRCodes);

/**
 * @route   DELETE /api/qr/:id
 * @desc    Revoke a QR code
 * @access  Private (Patient)
 */
router.delete('/:id', protect, revokeQRCode);

/**
 * @route   GET /api/qr/public/:token
 * @desc    Access records via share token (PUBLIC - NO AUTH)
 * @access  Public
 */
router.get('/public/:token', accessViaToken);

module.exports = router;