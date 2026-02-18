//backend/src/routes/profileRoutes.js

const express = require('express');
const router = express.Router();
const {
  createPatientProfile,
  createDoctorProfile,
  getMyProfile
} = require('../controllers/profileController');
const { protect } = require('../middlewares/authMiddleware');

// Protect all routes
router.use(protect);

// ✅ NEW: Unified create/update endpoint
router.post('/profile', async (req, res, next) => {
  try {
    if (req.user.role === 'patient') {
      return createPatientProfile(req, res, next);
    } else if (req.user.role === 'doctor') {
      return createDoctorProfile(req, res, next);
    } else {
      return res.status(400).json({ message: 'Invalid role for profile creation' });
    }
  } catch (err) {
    next(err);
  }
});

router.put('/profile', async (req, res, next) => {
  try {
    if (req.user.role === 'patient') {
      return createPatientProfile(req, res, next); // Service handles create OR update
    } else if (req.user.role === 'doctor') {
      return createDoctorProfile(req, res, next); // Service handles create OR update
    } else {
      return res.status(400).json({ message: 'Invalid role for profile update' });
    }
  } catch (err) {
    next(err);
  }
});

// Original routes
router.post('/patient', createPatientProfile);
router.post('/doctor', createDoctorProfile);

// Get profile routes
router.get('/profile', getMyProfile);
router.get('/me', getMyProfile);

module.exports = router;