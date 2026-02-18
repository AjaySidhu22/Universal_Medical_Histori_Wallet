// backend/src/controllers/adminController.js

 

const { User, DoctorProfile, PatientProfile, MedicalRecord, AccessRequest, ShareToken, sequelize } = require('../models');
const logger = require('../utils/logger');

// --- 1. GET all users ---
const getAllUsers = async (req, res, next) => {
  try {
     const users = await User.findAll({
          attributes: ['id', 'email', 'role', 'createdAt', 'updatedAt', 'isEmailVerified'] // ✅ ADDED
      });
    res.json(users);
  } catch (err) {
    logger.error('Get all users failed:', err);
    next(err);
  }
};

// --- 2. DELETE a user by ID ---
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Delete related records first to avoid foreign key constraint errors
    if (user.role === 'patient') {
      const patientProfile = await PatientProfile.findOne({ where: { userId: id } });
      if (patientProfile) {
        // Delete medical records
        await MedicalRecord.destroy({ where: { patientId: patientProfile.id }, force: true });
        // Delete access requests
        await AccessRequest.destroy({ where: { patientId: patientProfile.id } });
        // Delete share tokens
        await ShareToken.destroy({ where: { patientId: patientProfile.id } });
        // Delete patient profile
        await patientProfile.destroy();
      }
    } else if (user.role === 'doctor') {
      const doctorProfile = await DoctorProfile.findOne({ where: { userId: id } });
      if (doctorProfile) {
        // Delete medical records created by doctor
        await MedicalRecord.destroy({ where: { doctorId: doctorProfile.id }, force: true });
        // Delete access requests
        await AccessRequest.destroy({ where: { doctorId: doctorProfile.id } });
        // Delete doctor profile
        await doctorProfile.destroy();
      }
    }

    // Delete user
    await user.destroy();

    logger.info('User deleted successfully', { userId: id, adminId: req.user.id });

    res.json({ 
      success: true, 
      message: 'User and all related data deleted successfully' 
    });

  } catch (err) {
    logger.error('Delete user failed:', err);
    next(err);
  }
};

// --- 3. UPDATE a user's role ---
const updateUserRole = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { role } = req.body;

    // 1. Validate role
    const allowedRoles = ['patient', 'doctor', 'admin'];
    if (!allowedRoles.includes(role)) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Invalid role specified.' });
    }

    const user = await User.findByPk(id, { transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. Prevent self-demotion from admin
    if (req.user && String(req.user.id) === String(id) && user.role === 'admin' && role !== 'admin') {
      await transaction.rollback();
      return res.status(400).json({ message: "You cannot remove your own admin role." });
    }

    // 3. Prevent removing the last admin
    if (user.role === 'admin' && role !== 'admin') {
      const adminCount = await User.count({ where: { role: 'admin' }, transaction });
      if (adminCount <= 1) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Cannot remove the last admin from the system.' });
      }
    }

    // 4. Perform update
    user.role = role;
    await user.save({ transaction });
    await transaction.commit();

    logger.info(`User role updated: ${id} to ${role}`, { adminId: req.user.id });
    res.json({
      message: 'Role updated successfully',
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (err) {
    await transaction.rollback();
    logger.error('Update user role failed:', err);
    next(err);
  }
};

// --- 4. TOGGLE DOCTOR VERIFICATION ---
const toggleDoctorVerification = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    const doctorProfile = await DoctorProfile.findByPk(id, { transaction });
    if (!doctorProfile) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Doctor profile not found.' });
    }

    doctorProfile.isVerified = isVerified;
    await doctorProfile.save({ transaction });
    await transaction.commit();

    logger.info(`Doctor verification updated: ${id} to ${isVerified}`, { adminId: req.user.id });
    res.json({
      message: `Doctor verification set to ${isVerified}`,
      profile: { 
        id: doctorProfile.id, 
        isVerified: doctorProfile.isVerified,
        userId: doctorProfile.userId
      }
    });
  } catch (err) {
    await transaction.rollback();
    logger.error('Toggle doctor verification failed:', err);
    next(err);
  }
};

// --- 5. GET UNVERIFIED DOCTORS ---
const getUnverifiedDoctors = async (req, res, next) => {
  try {
    const unverifiedDoctors = await DoctorProfile.findAll({
      where: { isVerified: false },
      include: [
        {
          model: User,
          as: 'User', // ADDED BACK: Sequelize requires this because we defined it in the model
          attributes: ['id', 'email', 'createdAt']
        }
      ],
      attributes: ['id', 'name', 'specialty', 'licenseNumber', 'isVerified', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'ASC']]
    });

    res.json(unverifiedDoctors);
  } catch (err) {
    logger.error('Get unverified doctors failed:', err);
    console.error('Detailed error:', err);
    next(err);
  }
};

module.exports = { 
  getAllUsers, 
  deleteUser, 
  updateUserRole,
  toggleDoctorVerification,
  getUnverifiedDoctors
};