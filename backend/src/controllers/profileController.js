//backend/src/controllers/profileController.js

const {
  createPatientProfileService,
  createDoctorProfileService,
  getUserProfileService
} = require('../services/profileService');
const User = require('../models/userModel'); // ✅ NEW: Import User model

const createPatientProfile = async (req, res, next) => {
  try {
    const profile = await createPatientProfileService(req.user, req.body);
    res.status(201).json({ message: 'Patient profile created', profile });
  } catch (err) {
    next(err);
  }
};

const createDoctorProfile = async (req, res, next) => {
  try {
    const profile = await createDoctorProfileService(req.user, req.body);
    res.status(201).json({ message: 'Doctor profile created', profile });
  } catch (err) {
    next(err);
  }
};

// ✅ NEW: Updated to match frontend expectations
const getMyProfile = async (req, res, next) => {
  try {
    // Get user details
    const { User: UserModel } = require('../models');
    const user = await UserModel.findByPk(req.user.id, {
      attributes: ['id', 'email', 'username', 'role', 'twoFactorEnabled'] // ✅ ADDED: username
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get profile based on role
    const profile = await getUserProfileService(req.user);

    // Return in the format frontend expects
    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username, // ✅ ADDED: username
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled
      },
      profile
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPatientProfile,
  createDoctorProfile,
  getMyProfile
};