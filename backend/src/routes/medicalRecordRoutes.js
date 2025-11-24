// // \backend\src\routes\medicalRecordRoutes.js

// const express = require('express');
// const router = express.Router();

// const {
//   createRecord,
//   getPatientRecords,
//   updateRecord,
//   deleteRecord,
// } = require('../controllers/medicalRecordController');

// // Import protect and role-check middlewares
// const { protect, requireDoctorOrAdmin, requirePatientOrDoctor } = require('../middlewares/authMiddleware');

// const upload = require('../middlewares/uploadMiddleware');

// // Routes for Medical Records

// // Create a new record (Doctor/Admin only)
// // **MODIFIED ROUTE**: Add upload middleware to handle the file field 'medicalFile'
// router.post(
//   '/',
//   protect,
//   requireDoctorOrAdmin,
//   upload.single('medicalFile'), // <--- **NEW MIDDLEWARE**
//   createRecord
// );

// // Get all records for a patient (Patient, Doctor, Admin)
// router.get('/patient/:patientId', protect, requirePatientOrDoctor, getPatientRecords);

// // Update a specific record (Doctor/Admin only)
// router.put('/:id', protect, requireDoctorOrAdmin, updateRecord);

// // Delete a specific record (Doctor/Admin only)
// router.delete('/:id', protect, requireDoctorOrAdmin, deleteRecord);

// module.exports = router;



const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator'); // Import validator
const validate = require('../middlewares/validateMiddleware'); // Import validation middleware

const {
    createRecord,
    getPatientRecords,
    updateRecord,
    deleteRecord,
    getRecordFileUrl // NEW FUNCTION: Requires update to medicalRecordController
} = require('../controllers/medicalRecordController');

// Import protect and role-check middlewares
const { protect, requireDoctorOrAdmin, requirePatientOrDoctor } =
 require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// --- 1. Create a new record (Doctor/Admin only) ---
router.post(
    '/',
    protect,
    requireDoctorOrAdmin,
    // Improvement: Add validation before upload (if possible) or before controller logic
    [
        body('patientId').isUUID().withMessage('Valid patient ID (UUID) is required.'),
        body('title').isLength({ min: 3 }).withMessage('Title is required.')
    ],
    validate, 
    upload.single('medicalFile'), 
    createRecord
);

// --- 2. Get all records for a patient (Patient, Doctor, Admin) ---
router.get(
    '/patient/:patientId', 
    protect, 
    requirePatientOrDoctor, 
    [param('patientId').isUUID().withMessage('Valid patient ID (UUID) is required.')],
    validate,
    getPatientRecords
);

// --- 3. Get file for a specific record (CRITICAL NEW SECURE ROUTE) ---
// Note: This route uses the same authorization logic as viewing records.
router.get(
    '/:id/file', 
    protect, 
    requirePatientOrDoctor,
    [param('id').isUUID().withMessage('Valid record ID (UUID) is required.')],
    validate,
    getRecordFileUrl // Generates a pre-signed S3 URL
);

// --- 4. Update a specific record (Doctor/Admin only) ---
router.put(
    '/:id', 
    protect, 
    requireDoctorOrAdmin, 
    [
        param('id').isUUID().withMessage('Valid record ID (UUID) is required.'),
        body('title').optional().isLength({ min: 3 }).withMessage('Title must be at least 3 characters.')
    ],
    validate,
    updateRecord
);

// --- 5. Delete a specific record (Doctor/Admin only) ---
router.delete(
    '/:id', 
    protect, 
    requireDoctorOrAdmin, 
    [param('id').isUUID().withMessage('Valid record ID (UUID) is required.')],
    validate,
    deleteRecord
);

module.exports = router;