// const express = require('express');
// const router = express.Router();
// const { getAllUsers, deleteUser, updateUserRole } = require('../controllers/adminController');
// const { protect } = require('../middlewares/authMiddleware');
// const requireAdmin = require('../middlewares/requireAdmin');

// // All routes below require admin role
// router.use(protect, requireAdmin);

// router.get('/users', getAllUsers);
// router.delete('/users/:id', deleteUser);
// router.put('/users/:id/role', updateUserRole);

// module.exports = router;


const express = require('express');
const router = express.Router();
const { body } = require('express-validator'); // Import validator
const validate = require('../middlewares/validateMiddleware'); // Import validation middleware
const { 
    getAllUsers, 
    deleteUser, 
    updateUserRole, 
    toggleDoctorVerification // Requires future addition to adminController
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

// --- Improvement 1: Dedicated route for Doctor Verification ---
// This route will allow an admin to toggle the 'isVerified' status on a DoctorProfile.
router.put(
    '/doctors/:id/verify', 
    [
        body('isVerified').isBoolean().withMessage('Verification status must be a boolean.')
    ],
    validate,
    toggleDoctorVerification // Requires future addition to adminController
);


module.exports = router;