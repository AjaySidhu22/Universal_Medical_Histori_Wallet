// const express = require('express');
// const { registerUser, loginUser, requestPasswordReset, resetPassword } = require('../controllers/authController');
// const { body } = require('express-validator');
// const validate = require('../middlewares/validateMiddleware');
// const { refreshAccessToken, logoutUser } = require('../controllers/authController');

// const router = express.Router();

// router.post('/refresh-token', refreshAccessToken);
// router.post('/logout', logoutUser);

// // Register validation
// router.post(
//   '/register',
//   [
//     body('email').isEmail().withMessage('Valid email is required'),
//     body('password')
//       .isLength({ min: 6 })
//       .withMessage('Password must be at least 6 characters'),
//     body('role')
//       .optional()
//       .isIn(['patient', 'doctor', 'admin'])
//       .withMessage('Role must be patient, doctor, or admin')
//   ],
//   validate,
//   registerUser
// );

// // Login validation
// router.post(
//   '/login',
//   [
//     body('email').isEmail().withMessage('Valid email is required'),
//     body('password').notEmpty().withMessage('Password is required')
//   ],
//   validate,
//   loginUser
// );

// // Request password reset
// router.post(
//   '/request-password-reset',
//   [ body('email').isEmail().withMessage('Valid email is required') ],
//   validate,
//   requestPasswordReset
// );

// // Reset password
// router.post(
//   '/reset-password',
//   [
//     body('token').notEmpty().withMessage('Token is required'),
//     body('password')
//       .isLength({ min: 6 })
//       .withMessage('Password must be at least 6 characters')
//   ],
//   validate,
//   resetPassword
// );

// module.exports = router;



const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middlewares/validateMiddleware');
const rateLimit = require('express-rate-limit'); // Import rate limiter

const { 
    registerUser, 
    loginUser, 
    requestPasswordReset, 
    resetPassword,
    refreshAccessToken, 
    logoutUser 
} = require('../controllers/authController');

// --- Rate Limiter Configurations (Improvement 1) ---

// General login/registration limiter: 5 attempts per minute
const authLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // Limit each IP to 5 requests per windowMs
    message: { success: false, message: 'Too many requests, please try again after 1 minute.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Password reset limiter: More strict to protect email service
const resetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 requests per hour
    message: { success: false, message: 'Password reset limited. Try again in an hour.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// --- Routes ---

// Session management (unprotected, rely on cookies)
router.post('/refresh-token', refreshAccessToken); // Uses long-lived token
router.post('/logout', logoutUser); // Clears tokens

// 1. Register validation (Uses authLimiter)
router.post(
    '/register',
    authLimiter, // Apply rate limit
    [
        // Improvement 2: Added trim and normalization for security
        body('email').trim().normalizeEmail().isEmail().withMessage('Valid email is required'),
        body('password')
            .isLength({ min: 8 }) // Improvement 3: Enforce min 8 characters for stronger security
            .withMessage('Password must be at least 8 characters'),
        body('role')
            .optional()
            .isIn(['patient', 'doctor']) // Removed 'admin' as registration should be restricted
            .withMessage('Role must be patient or doctor')
    ],
    validate,
    registerUser
);

// 2. Login validation (Uses authLimiter)
router.post(
    '/login',
    authLimiter, // Apply rate limit
    [
        body('email').trim().normalizeEmail().isEmail().withMessage('Valid email is required'),
        body('password').notEmpty().withMessage('Password is required')
    ],
    validate,
    loginUser
);

// 3. Request password reset (Uses stricter resetLimiter)
router.post(
    '/request-password-reset',
    resetLimiter, // Apply strict rate limit
    [body('email').trim().normalizeEmail().isEmail().withMessage('Valid email is required')],
    validate,
    requestPasswordReset
);

// 4. Reset password
router.post(
    '/reset-password',
    [
        body('token').notEmpty().withMessage('Token is required'),
        body('password')
            .isLength({ min: 8 }) // Consistent password length
            .withMessage('Password must be at least 8 characters')
    ],
    validate,
    resetPassword
);

module.exports = router;