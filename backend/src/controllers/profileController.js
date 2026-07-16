//backend/src/controllers/profileController.js

const {
  createPatientProfileService,
  createDoctorProfileService,
  getUserProfileService
} = require('../services/profileService');

const createOrUpdateProfile = async (req, res, next) => {
  try {
    let profile;
    let isNew = false;

    if (req.user.role === 'patient') {
      const result = await createPatientProfileService(req.user, req.body);
      profile = result.profile;
      isNew = result.isNew;
    } else if (req.user.role === 'doctor') {
      const result = await createDoctorProfileService(req.user, req.body);
      profile = result.profile;
      isNew = result.isNew;
    } else {
      return res.status(403).json({ message: 'Only patients and doctors can create profiles' });
    }

    res.status(isNew ? 201 : 200).json({
      message: isNew ? 'Profile created' : 'Profile updated',
      profile
    });
  } catch (err) {
    next(err);
  }
};

const getMyProfile = async (req, res, next) => {
  try {
    const { User: UserModel } = require('../models');
    const user = await UserModel.findByPk(req.user.id, {
      attributes: ['id', 'email', 'username', 'role', 'twoFactorEnabled']
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const profile = await getUserProfileService(req.user);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
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
  createOrUpdateProfile,
  getMyProfile
};