// backend/src/routes/medicalRecordRoutes.js

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middlewares/validateMiddleware');
const { protect } = require('../middlewares/authMiddleware');
const { uploadSingle, handleUploadError } = require('../middlewares/uploadMiddleware');
const { recordCreationLimiter, uploadLimiter } = require('../middlewares/security');
const {
  createMedicalRecord,
  getMyMedicalRecords,
  getMedicalRecord,
  deleteMedicalRecord
} = require('../controllers/medicalRecordController');

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/medical
 * @desc    Create medical record with optional file upload
 */
router.post(
  '/',
  recordCreationLimiter, // Rate limit: 20 records per hour
  uploadLimiter,        // Rate limit: 20 uploads per hour
  uploadSingle,         // Handle file upload
  handleUploadError,    // Handle upload errors
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ min: 3, max: 200 })
      .withMessage('Title must be between 3 and 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Description must be less than 5000 characters'),
    body('diagnosis')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Diagnosis must be less than 5000 characters'),
    body('prescription')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Prescription must be less than 5000 characters'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Notes must be less than 5000 characters'),
    body('recordDate')
      .optional()
      .isDate()
      .withMessage('Record date must be a valid date'),
    body('patientId')
      .optional()
      .isUUID()
      .withMessage('Patient ID must be a valid UUID')
  ],
  validate,
  createMedicalRecord
);

/**
 * @route   GET /api/medical
 * @desc    Get all medical records for authenticated user
 */
router.get('/', getMyMedicalRecords);

/**
 * @route   GET /api/medical/:id
 * @desc    Get single medical record by ID
 */
router.get('/:id', getMedicalRecord);

/**
 * @route   DELETE /api/medical/:id
 * @desc    Delete medical record
 */
router.delete('/:id', deleteMedicalRecord);

module.exports = router;