// backend/src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middlewares/validateMiddleware');
const { authLimiter, passwordResetLimiter } = require('../middlewares/security');
const {
  registerUser,
  loginUser,
  requestPasswordReset,
  resetPassword,
  refreshAccessToken,
  logoutUser,
  verifyEmail,
  resendOTP,
  enable2FA,                 
  verify2FA,                 
  disable2FA,                
  verify2FALogin,            
  regenerateBackupCodes,
  checkUsernameAvailability      
} = require('../controllers/authController'); 
const { protect } = require('../middlewares/authMiddleware');
// ==============================================
// SESSION MANAGEMENT ROUTES (Unprotected)
// ==============================================

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token using refresh token cookie
 * @access  Public (requires valid refresh token cookie)
 */
router.post('/refresh-token', refreshAccessToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and clear tokens
 * @access  Public
 */
router.post('/logout', logoutUser);

// ==============================================
// USERNAME AVAILABILITY CHECK
// ==============================================

/**
 * @route   GET /api/auth/check-username?username=john_smith
 * @desc    Check if username is available (real-time check)
 * @access  Public
 */
router.get('/check-username', checkUsernameAvailability);

// ==============================================
// REGISTRATION ROUTE
// ==============================================
/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (patient or doctor)
 * @access  Public
 */
router.post(
  '/register',
  authLimiter,
  [
    body('email')
      .trim()
      .normalizeEmail()
      .isEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('username')  // ✅ ADD username validation
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username can only contain letters, numbers, underscores, and dashes'),
    body('role')
      .optional()
      .isIn(['patient', 'doctor'])
      .withMessage('Role must be patient or doctor')
  ],
  validate,
  registerUser
);

// ==============================================
// LOGIN ROUTE
// ==============================================

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return tokens
 * @access  Public
 */
router.post(
  '/login',
  authLimiter,
  [
    body('email')
      .trim()
      .normalizeEmail()
      .isEmail()
      .withMessage('Valid email is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  validate,
  loginUser
);

// ==============================================
// PASSWORD RESET ROUTES
// ==============================================

/**
 * @route   POST /api/auth/request-password-reset
 * @desc    Request password reset email
 * @access  Public
 */
router.post(
  '/request-password-reset',
  passwordResetLimiter,
  [
    body('email')
      .trim()
      .normalizeEmail()
      .isEmail()
      .withMessage('Valid email is required')
  ],
  validate,
  requestPasswordReset
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using token from email
 * @access  Public
 */
router.post(
  '/reset-password',
  [
    body('token')
      .notEmpty()
      .withMessage('Token is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
  ],
  validate,
  resetPassword
);

// ==============================================
// EMAIL VERIFICATION ROUTES
// ==============================================

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email address with OTP
 * @access  Public
 */
router.post(
  '/verify-email',
  authLimiter,
  [
    body('email')
      .trim()
      .normalizeEmail()
      .isEmail()
      .withMessage('Valid email is required'),
    body('otp')
      .notEmpty()
      .withMessage('OTP is required')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits')
      .isNumeric()
      .withMessage('OTP must contain only numbers')
  ],
  validate,
  verifyEmail
);

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Resend email verification OTP
 * @access  Public
 */
router.post(
  '/resend-otp',
  authLimiter,
  [
    body('email')
      .trim()
      .normalizeEmail()
      .isEmail()
      .withMessage('Valid email is required')
  ],
  validate,
  resendOTP
);

// ==============================================
// 2FA ROUTES
// ==============================================

/**
 * @route   POST /api/auth/2fa/enable
 * @desc    Enable 2FA for user account
 * @access  Private (requires authentication)
 */
router.post(
  '/2fa/enable',
  protect,
  enable2FA
);

/**
 * @route   POST /api/auth/2fa/verify
 * @desc    Verify 2FA setup with TOTP code
 * @access  Private (requires authentication)
 */
router.post(
  '/2fa/verify',
   protect,
  [
    body('token')
      .notEmpty()
      .withMessage('Verification token is required')
      .isLength({ min: 6, max: 6 })
      .withMessage('Token must be 6 digits')
      .isNumeric()
      .withMessage('Token must contain only numbers')
  ],
  validate,
  verify2FA
);

/**
 * @route   POST /api/auth/2fa/disable
 * @desc    Disable 2FA for user account
 * @access  Private (requires authentication)
 */
router.post(
  '/2fa/disable',
   protect,
  [
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  validate,
  disable2FA
);

/**
 * @route   POST /api/auth/2fa/verify-login
 * @desc    Verify 2FA code during login
 * @access  Public
 */
router.post(
  '/2fa/verify-login',
  authLimiter,
  [
    body('userId')
      .notEmpty()
      .withMessage('User ID is required'),
    body('token')
      .notEmpty()
      .withMessage('Verification token is required')
      .isLength({ min: 6, max: 8 })
      .withMessage('Token must be 6-8 characters'),
    body('isBackupCode')
      .optional()
      .isBoolean()
      .withMessage('isBackupCode must be boolean')
  ],
  validate,
  verify2FALogin
);

/**
 * @route   POST /api/auth/2fa/regenerate-backup-codes
 * @desc    Regenerate backup codes
 * @access  Private (requires authentication)
 */
router.post(
  '/2fa/regenerate-backup-codes',
  protect,
  [
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  validate,
  regenerateBackupCodes
);

module.exports = router;