//  const jwt = require('jsonwebtoken');
// const path = require('path');
// require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// const protect = (req, res, next) => {
//   let token = req.cookies.accessToken; // Check cookie first

//   if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
//     token = req.headers.authorization.split(' ')[1]; // Fallback to header
//   }

//   if (!token) {
//     return res.status(401).json({ message: 'Not authorized, no token.' });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch (error) {
//     return res.status(401).json({ message: 'Not authorized, token failed.' });
//   }
// };

// // Require Doctor or Admin
// const requireDoctorOrAdmin = (req, res, next) => {
//   if (req.user.role === 'doctor' || req.user.role === 'admin') {
//     return next();
//   }
//   return res.status(403).json({ message: 'Access denied: Doctor/Admin only' });
// };

// // Require Patient or Doctor
// const requirePatientOrDoctor = (req, res, next) => {
//   if (req.user.role === 'patient' || req.user.role === 'doctor' || req.user.role === 'admin') {
//     return next();
//   }
//   return res.status(403).json({ message: 'Access denied: Patient/Doctor/Admin only' });
// };

// module.exports = {
//   protect,
//   requireDoctorOrAdmin,
//   requirePatientOrDoctor
// };

const jwt = require('jsonwebtoken');
const path = require('path');
const { DoctorProfile } = require('../models'); // Import DoctorProfile model for verification check

// NOTE on dotenv: Removing the explicit dotenv call here as it is done globally in index.js.

/**
 * 1. Protection Middleware: Verifies the JWT Access Token.
 * Populates req.user with { id, role } if successful.
 */
const protect = (req, res, next) => {
    // Attempt 1: Check for Access Token in HTTP-only Cookie
    let token = req.cookies.accessToken; 

    // Attempt 2: Fallback to Authorization Header (for API clients/testing)
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        // 401: Unauthenticated
        return res.status(401).json({ message: 'Not authorized, no token.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attaches { id, role } to the request
        next();
    } catch (error) {
        // Improvement: Distinguish between general failure and expired token
        if (error.name === 'TokenExpiredError') {
             // 403 Forbidden suggests that the token is real but access is denied (expired)
             return res.status(403).json({ 
                message: 'Token expired. Please refresh session.',
                expired: true 
             });
        }
        // 401: Invalid signature or corrupted token
        return res.status(401).json({ message: 'Not authorized, token failed.' });
    }
};

/**
 * 2. Authorization Middleware: Requires Doctor or Admin role, AND doctor verification.
 */
const requireDoctorOrAdmin = async (req, res, next) => {
    // 1. Check Role Authorization
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied: Doctor/Admin only' });
    }
    
    // 2. CRITICAL SECURITY CHECK: Check Doctor Verification if the user is a Doctor
    if (req.user.role === 'doctor') {
        try {
            const doctorProfile = await DoctorProfile.findOne({ where: { userId: req.user.id } });
            
            // Check 1: Must have a profile created
            if (!doctorProfile) {
                return res.status(403).json({ message: 'Access denied: Doctor profile not yet created.' });
            }
            // Check 2: Must be verified by Admin
            if (!doctorProfile.isVerified) {
                return res.status(403).json({ message: 'Access denied: Doctor profile is pending verification.' });
            }
        } catch (error) {
            console.error('Doctor verification check failed:', error);
            return res.status(500).json({ message: 'Server error during authorization check.' });
        }
    }

    // Pass the request if all checks are successful
    return next();
};

/**
 * 3. Authorization Middleware: Requires Patient, Doctor, or Admin role.
 */
const requirePatientOrDoctor = (req, res, next) => {
    const role = req.user.role;
    if (role === 'patient' || role === 'doctor' || role === 'admin') {
        return next();
    }
    return res.status(403).json({ message: 'Access denied: Patient/Doctor/Admin only' });
};

// --- Export Functions ---
module.exports = {
    protect,
    requireDoctorOrAdmin,
    requirePatientOrDoctor
};