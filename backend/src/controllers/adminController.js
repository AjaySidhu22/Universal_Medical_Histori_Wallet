// const User = require('../models/User');

// // GET all users
// const getAllUsers = async (req, res, next) => {
//   try {
//     const users = await User.findAll({
//       attributes: ['id', 'email', 'role', 'createdAt']
//     });
//     res.json(users);
//   } catch (err) {
//     next(err);
//   }
// };

// // DELETE a user by ID
// const deleteUser = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const deleted = await User.destroy({ where: { id } });
//     if (!deleted) return res.status(404).json({ message: 'User not found' });
//     res.json({ message: 'User deleted successfully' });
//   } catch (err) {
//     next(err);
//   }
// };

// // UPDATE a user’s role (safe)
// const updateUserRole = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const { role } = req.body;

//     // validate
//     if (!['patient', 'doctor', 'admin'].includes(role)) {
//       return res.status(400).json({ message: 'Invalid role' });
//     }

//     // prevent self-demotion
//     if (req.user && String(req.user.id) === String(id) && role !== 'admin') {
//       return res.status(400).json({ message: "You cannot remove your own admin role." });
//     }

//     const user = await User.findByPk(id);
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     // prevent removing last admin
//     if (user.role === 'admin' && role !== 'admin') {
//       const adminCount = await User.count({ where: { role: 'admin' } });
//       if (adminCount <= 1) {
//         return res.status(400).json({ message: 'Cannot remove the last admin.' });
//       }
//     }

//     user.role = role;
//     await user.save();

//     res.json({
//       message: 'Role updated successfully',
//       user: { id: user.id, email: user.email, role: user.role }
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// module.exports = { getAllUsers, deleteUser, updateUserRole };


const User = require('../models/User');
const { MedicalRecord, PatientProfile, DoctorProfile, sequelize } = require('../models'); // Import required models and sequelize instance

// --- 1. GET all users ---
const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.findAll({
            // CRITICAL SECURITY: Only select necessary, non-sensitive fields
            attributes: ['id', 'email', 'role', 'createdAt', 'updatedAt'] 
        });
        res.json(users);
    } catch (err) {
        next(err);
    }
};

// --- 2. DELETE a user by ID ---
const deleteUser = async (req, res, next) => {
    const transaction = await sequelize.transaction(); // Start transaction
    try {
        const { id } = req.params;
        
        // 1. Check if the user exists
        const userToDelete = await User.findByPk(id, { transaction });
        if (!userToDelete) {
             await transaction.rollback();
             return res.status(404).json({ message: 'User not found' });
        }

        // 2. Prevent self-deletion
        if (req.user && String(req.user.id) === String(id)) {
             await transaction.rollback();
             return res.status(400).json({ message: 'You cannot delete your own user account.' });
        }
        
        // FUTURE IMPROVEMENT: S3 Cleanup Logic
        // If the deleted user was a patient, their medical files (stored under their user ID in S3)
        // should be securely removed here using the AWS SDK delete function.
        // const patientProfile = await PatientProfile.findOne({ where: { userId: id } });
        // if (patientProfile) { 
        //     await s3Service.deleteFolder(id); // Custom S3 function
        // }

        // 3. Perform the cascading delete
        // onDelete: CASCADE handles related Patient/Doctor profiles and ShareTokens.
        const deleted = await User.destroy({ where: { id }, transaction });
        
        if (!deleted) {
             await transaction.rollback();
             return res.status(404).json({ message: 'User not found' });
        }

        await transaction.commit();
        res.json({ message: 'User and associated data deleted successfully' });
    } catch (err) {
        await transaction.rollback();
        next(err);
    }
};

// --- 3. UPDATE a user's role (safe) ---
const updateUserRole = async (req, res, next) => {
    const transaction = await sequelize.transaction(); // Start transaction
    try {
        const { id } = req.params;
        const { role } = req.body;

        // 1. Validate role against ENUM values (redundant but safe check)
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
        await user.save({ transaction }); // Save within the transaction

        await transaction.commit(); // Commit all changes if successful

        res.json({
            message: 'Role updated successfully',
            user: { id: user.id, email: user.email, role: user.role }
        });
    } catch (err) {
        await transaction.rollback(); // Rollback if any error occurs
        next(err);
    }
};

// --- 4. TOGGLE DOCTOR VERIFICATION (Admin Only) ---
const toggleDoctorVerification = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params; // This ID is the DoctorProfile ID
        const { isVerified } = req.body;

        // 1. Find the Doctor Profile
        const doctorProfile = await DoctorProfile.findByPk(id, { transaction });
        
        if (!doctorProfile) {
            await transaction.rollback();
            // Using 400 here as the ID provided doesn't map to a DoctorProfile
            return res.status(400).json({ message: 'Doctor profile not found.' });
        }

        // 2. Update the verification status
        doctorProfile.isVerified = isVerified;
        await doctorProfile.save({ transaction });

        // 3. Optional: If verification is true, also ensure the related User is 'doctor' (prevent misrole)
        // This is usually handled on user creation, but good for security consistency.

        await transaction.commit();

        res.json({
            message: `Doctor verification set to ${isVerified}`,
            profile: { 
                id: doctorProfile.id, 
                isVerified: doctorProfile.isVerified,
                userId: doctorProfile.userId // Optionally return user ID for context
            }
        });
    } catch (err) {
        await transaction.rollback();
        next(err);
    }
};

module.exports = { 
    getAllUsers, 
    deleteUser, 
    updateUserRole,
    toggleDoctorVerification // NEW EXPORT
};