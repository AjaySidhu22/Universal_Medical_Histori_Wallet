const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');
const DoctorProfile = require('../models/DoctorProfile');
const { sequelize } = require('../models'); // Import sequelize instance for transactions

/**
 * @route GET /api/profile/profile
 * @description Get the authenticated user's profile details based on role.
 * @access Private
 */
const getProfile = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Not authorized.' });

        // Fetch User and ensure existence
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        const safeUser = { id: user.id, email: user.email, role: user.role };
        let profile = null;

        // Fetch the associated profile based on the role
        if (user.role === 'patient') {
            profile = await PatientProfile.findOne({ where: { userId } });
            
        } else if (user.role === 'doctor') {
            profile = await DoctorProfile.findOne({ where: { userId } });
            
            // Improvement 1: Include verification status for convenience
            if (profile) {
                // Attach the verification status to the profile response
                profile = profile.toJSON();
                profile.isVerified = profile.isVerified; 
            }
        } else {
             // Admin role does not have a profile here, only user management rights
             return res.status(200).json({ user: safeUser, message: 'Admin role does not have an updatable profile.' });
        }
        
        return res.status(200).json({ user: safeUser, profile });

    } catch (err) {
        console.error('Get profile error:', err);
        err.statusCode = err.statusCode || 500;
        next(err);
    }
};

/**
 * @route PUT /api/profile/profile
 * @description Create or update the authenticated user's profile based on role.
 * @access Private (Protected by protect and validateProfile middlewares)
 */
const updateProfile = async (req, res, next) => {
    const transaction = await sequelize.transaction(); // Improvement 2: Start transaction
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Not authorized.' });

        const user = await User.findByPk(userId, { transaction });
        if (!user) {
            await transaction.rollback();
            return res.status(404).json({ message: 'User not found.' });
        }
        
        let profileModel;
        let isDoctor = false;

        if (user.role === 'patient') {
            profileModel = PatientProfile;
        } else if (user.role === 'doctor') {
            profileModel = DoctorProfile;
            isDoctor = true;
        } else {
            // Should be blocked by validateProfile, but as a final guard:
            await transaction.rollback();
            return res.status(400).json({ message: 'Invalid role for profile update.' });
        }

        // Find or create the profile entry
        const [profile, created] = await profileModel.findOrCreate({
            where: { userId },
            defaults: { userId },
            transaction
        });

        // CRITICAL SECURITY: Prevent doctors from setting their own 'isVerified' status.
        if (isDoctor && req.body.isVerified !== undefined) {
             console.warn(`SECURITY: Attempt to set isVerified by non-admin user ${userId}`);
             delete req.body.isVerified; // Strip the field silently
        }
        
        // Apply updates to the profile
        await profile.update(req.body, { transaction });
        
        await transaction.commit(); // Commit transaction

        // Re-fetch the updated profile with verification status for response (if doctor)
        let responseProfile = profile.toJSON();
        if (isDoctor) {
            responseProfile.isVerified = profile.isVerified;
        }

        return res.status(200).json({ 
            message: 'Profile updated successfully.', 
            profile: responseProfile 
        });

    } catch (err) {
        await transaction.rollback(); // Rollback on error
        console.error('Update profile error:', err);
        err.statusCode = err.statusCode || 500;
        next(err);
    }
};

/**
 * @route GET /api/profile/public-profile
 * @description Example route for publicly fetching a sample profile (for testing).
 */
const getPublicProfile = async (req, res, next) => {
    try {
        const user = await User.findOne({ 
            attributes: ['id', 'email', 'role'], 
            where: { email: 'patient@example.com' } 
        });
        if (!user) return res.status(404).json({ message: 'Patient not found.' });
        res.status(200).json(user);
    } catch (err) {
        console.error('Get public profile error:', err);
        err.statusCode = err.statusCode || 500;
        next(err);
    }
};

module.exports = { getProfile, updateProfile, getPublicProfile };