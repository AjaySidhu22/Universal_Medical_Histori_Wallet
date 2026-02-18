// backend/src/routes/accessRequestRoutes.js

const express = require('express');
const router = express.Router();
const { accessRequestLimiter } = require('../middlewares/security');
const { body } = require('express-validator');
const validate = require('../middlewares/validateMiddleware');
const { protect } = require('../middlewares/authMiddleware');
const {
  createAccessRequest,
  getMyAccessRequests,
  respondToAccessRequest,
  cancelAccessRequest
} = require('../controllers/accessRequestController');

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/access-requests
 * @desc    Doctor creates access request
 */
router.post(
  '/',
  accessRequestLimiter,  
  [
  body('patientIdentifier')  // ✅ CHANGED
    .notEmpty()
    .withMessage('Patient username or email is required')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Patient identifier must be between 3 and 255 characters'),
    body('requestType')
      .optional()
      .isIn(['view', 'create', 'both'])
      .withMessage('Request type must be: view, create, or both'),
    body('reason')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Reason must be less than 500 characters'),
    body('durationHours')
    .optional()
    .isFloat({ min: 0.5, max: 720 })  // Changed from isInt to isFloat
    .withMessage('Duration must be between 0.5 hours (30 min) and 720 hours (30 days)')
  ],
  validate,
  createAccessRequest
);

/**
 * @route   GET /api/access-requests/my-requests
 * @desc    Get all access requests for current user
 */
router.get('/my-requests', getMyAccessRequests);

/**
 * @route   PUT /api/access-requests/:id/respond
 * @desc    Patient responds to access request
 */
router.put(
  '/:id/respond',
  [
    body('action')
      .notEmpty()
      .withMessage('Action is required')
      .isIn(['approve', 'deny'])
      .withMessage('Action must be approve or deny'),
    body('durationHours')
  .optional()
  .isFloat({ min: 0.5, max: 720 })
  .withMessage('Duration must be between 0.5 hours (30 min) and 720 hours (30 days)')
  ],
  validate,
  respondToAccessRequest
);

/**
 * @route   DELETE /api/access-requests/:id
 * @desc    Doctor cancels access request
 */
router.delete('/:id', cancelAccessRequest);

module.exports = router;