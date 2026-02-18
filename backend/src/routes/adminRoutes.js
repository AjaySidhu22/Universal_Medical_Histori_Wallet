// backend/src/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const { body } = require('express-validator'); // Import validator
const validate = require('../middlewares/validateMiddleware'); // Import validation middleware
const { 
    getAllUsers, 
    deleteUser, 
    updateUserRole, 
    toggleDoctorVerification,
    getUnverifiedDoctors // ✅ NEW IMPORT
} = require('../controllers/adminController');
const { protect } = require('../middlewares/authMiddleware');
const requireAdmin = require('../middlewares/requireAdmin');

// --- CRITICAL SECURITY: Apply protection to all routes in this file ---
router.use(protect, requireAdmin);

// 1. GET all users
router.get('/users', getAllUsers);

// 2. DELETE a user by ID
router.delete('/users/:id', deleteUser);

// 3. UPDATE a user's role (Requires basic validation)
router.put(
    '/users/:id/role', 
    [
        body('role')
            .isIn(['patient', 'doctor', 'admin'])
            .withMessage('Role must be patient, doctor, or admin')
    ],
    validate, 
    updateUserRole
);

// 4. GET unverified doctors (✅ NEW ROUTE)
router.get('/doctors/unverified', getUnverifiedDoctors);

// 5. UPDATE doctor verification status
router.put(
    '/doctors/:id/verify', 
    [
        body('isVerified').isBoolean().withMessage('Verification status must be a boolean.')
    ],
    validate,
    toggleDoctorVerification
);

module.exports = router;