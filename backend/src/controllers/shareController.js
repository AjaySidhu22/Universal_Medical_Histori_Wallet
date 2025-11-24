// // \backend\src\controllers\shareController.js
// const { PatientProfile, ShareToken, MedicalRecord, DoctorProfile, User } = require('../models'); // **ADDED User**
// const crypto = require('crypto');
// // Helper to calculate expiration date based on duration string (e.g., '7d', '1h')
// const calculateExpiry = (duration) => {
//     const value = parseInt(duration);
//     const unit = duration.slice(-1); // 'd' or 'h'
//     let expiry = new Date();

//     if (unit === 'd') {
//         expiry.setDate(expiry.getDate() + value); // days
//     } else if (unit === 'h') {
//         expiry.setHours(expiry.getHours() + value); // hours
//     } else {
//         // Default to 7 days if duration is invalid or not specified
//         expiry.setDate(expiry.getDate() + 7);
//     }
//     return expiry;
// };

// /**
//  * @route POST /api/share
//  * @description Patient generates a share token for their medical records.
//  * @access Private (Patient only)
//  */
// const generateShareToken = async (req, res, next) => {
//     try {
//         const { duration, sharedWithEmail } = req.body;
//         const currentUserId = req.user.id;

//         // 1. Check if user is a patient and has a profile
//         if (req.user.role !== 'patient') {
//             return res.status(403).json({ success: false, message: 'Only patients can share records.' });
//         }
//         const patientProfile = await PatientProfile.findOne({ where: { userId: currentUserId } });
//         if (!patientProfile) {
//             return res.status(403).json({ success: false, message: 'Complete your profile before sharing.' });
//         }
//         const patientId = patientProfile.id;

//         // 2. Generate raw token, hash it, and calculate expiry
//         const rawToken = crypto.randomBytes(32).toString('hex');
//         const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
//         const expiresAt = calculateExpiry(duration);

//         // 3. Save hashed token to DB
//         await ShareToken.create({
//             token: tokenHash,
//             patientId: patientId,
//             expiresAt: expiresAt,
//             sharedWithEmail: sharedWithEmail || null
//         });

//         // 4. Return the raw token (NOT the hash) to the client
//         res.status(201).json({
//             success: true,
//             message: 'Share link generated.',
//             // Full share URL for easy copy-paste
//             shareUrl: `http://localhost:3000/share/view?token=${rawToken}`,
//             rawToken: rawToken,
//             expiresAt: expiresAt
//         });

//     } catch (err) {
//         next(err);
//     }
// };

// /**
//  * @route GET /api/share/:token
//  * @description Retrieve patient records using a valid share token.
//  * @access Public (Unprotected)
//  */
// const getRecordsByShareToken = async (req, res, next) => {
//     try {
//         const { token } = req.params;

//         // 1. Hash the incoming token to match the database entry
//         const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

//         // 2. Find the token and check expiry
//         const shareToken = await ShareToken.findOne({ where: { token: tokenHash } });

//         if (!shareToken || new Date() > new Date(shareToken.expiresAt)) {
//             return res.status(401).json({ success: false, message: 'Invalid or expired share token.' });
//         }

//         // 3. Retrieve the patient's records using the patientId from the token
//         const records = await MedicalRecord.findAll({
//             where: { patientId: shareToken.patientId },
//             include: [
//                 {
//                     model: DoctorProfile,
//                     attributes: ['id', 'specialty', 'licenseNumber'],
//                     // We now correctly reference the User model 
//                     include: [{ model: User, attributes: ['email'] }] // <--- **FIXED**
//                 }
//             ],
//             order: [['recordDate', 'DESC']]
//         });
//         // 4. Optionally, include the patient's identity (safely)
//         const patientProfile = await PatientProfile.findByPk(shareToken.patientId, {
//             attributes: ['dateOfBirth', 'bloodGroup', 'allergies'],
//             include: [{ model: User, attributes: ['email'] }] // <--- **FIXED**
//         });


//         res.json({
//             success: true,
//             patient: patientProfile,
//             records: records
//         });

//     } catch (err) {
//         next(err);
//     }
// };

//  /**
//  * @route GET /api/share/manage
//  * @description Patient lists all active share tokens they created.
//  * @access Private (Patient only)
//  */
// const listShareTokens = async (req, res, next) => {
//     try {
//         if (req.user.role !== 'patient') {
//             return res.status(403).json({ success: false, message: 'Access denied.' });
//         }
        
//         // 1. Get the PatientProfile ID
//         const patientProfile = await PatientProfile.findOne({ where: { userId: req.user.id } });
//         if (!patientProfile) {
//             return res.status(404).json({ success: false, message: 'Patient profile not found.' });
//         }

//         // 2. Find all active tokens associated with this PatientProfile ID
//         const activeTokens = await ShareToken.findAll({
//             where: { patientId: patientProfile.id },
//             attributes: ['id', 'expiresAt', 'sharedWithEmail', 'createdAt'],
//             order: [['createdAt', 'DESC']]
//         });

//         // NOTE: We do not return the raw hash (token field) here for security.
//         res.json({ success: true, tokens: activeTokens });

//     } catch (err) {
//         next(err);
//     }
// };

// /**
//  * @route DELETE /api/share/manage/:tokenId
//  * @description Patient revokes/deletes an active share token.
//  * @access Private (Patient only)
//  */
// const revokeShareToken = async (req, res, next) => {
//     try {
//         const { tokenId } = req.params;

//         if (req.user.role !== 'patient') {
//             return res.status(403).json({ success: false, message: 'Access denied.' });
//         }
        
//         // 1. Get the PatientProfile ID
//         const patientProfile = await PatientProfile.findOne({ where: { userId: req.user.id } });
//         if (!patientProfile) {
//             return res.status(404).json({ success: false, message: 'Patient profile not found.' });
//         }

//         // 2. Delete the token, ensuring it belongs to the current patient
//         const deletedCount = await ShareToken.destroy({
//             where: {
//                 id: tokenId,
//                 patientId: patientProfile.id // **CRITICAL SECURITY CHECK**
//             }
//         });

//         if (deletedCount === 0) {
//             return res.status(404).json({ success: false, message: 'Token not found or unauthorized.' });
//         }

//         res.json({ success: true, message: 'Share token successfully revoked.' });

//     } catch (err) {
//         next(err);
//     }
// };
// // **END of new functions**

// // Update the module.exports block to include the new functions:
// module.exports = {
//     generateShareToken,
//     getRecordsByShareToken,
//     listShareTokens, // **NEW EXPORT**
//     revokeShareToken // **NEW EXPORT**
// };


const { PatientProfile, ShareToken, MedicalRecord, DoctorProfile, User } = require('../models');
const crypto = require('crypto');
// We need to access the database to use Sequelize functions 
const { sequelize } = require('../config/database'); 

// --- Helper Functions ---

// Helper to calculate expiration date based on duration string (e.g., '7d', '1h')
const calculateExpiry = (duration) => {
    const value = parseInt(duration);
    const unit = duration.slice(-1); // 'd' or 'h'
    let expiry = new Date();
    
    // Default to 7 days if duration is invalid or not specified
    if (isNaN(value) || !['d', 'h'].includes(unit)) {
         expiry.setDate(expiry.getDate() + 7);
         return expiry;
    }

    if (unit === 'd') {
        expiry.setDate(expiry.getDate() + value); // days
    } else if (unit === 'h') {
        expiry.setHours(expiry.getHours() + value); // hours
    }
    return expiry;
};

// --- Controller Functions ---

/**
 * @route POST /api/share
 * @description Patient generates a share token for their medical records.
 * @access Private (Patient only)
 */
const generateShareToken = async (req, res, next) => {
    try {
        // We use validation middleware (express-validator) to ensure duration/email format.
        const { duration, sharedWithEmail, accessScope = 'full' } = req.body;
        const currentUserId = req.user.id;

        // 1. Check if user is a patient and has a profile
        if (req.user.role !== 'patient') {
            return res.status(403).json({ success: false, message: 'Only patients can generate share tokens.' });
        }
        
        const patientProfile = await PatientProfile.findOne({ where: { userId: currentUserId } });
        if (!patientProfile) {
            return res.status(403).json({ success: false, message: 'Complete your patient profile before sharing.' });
        }
        const patientId = patientProfile.id;

        // 2. Generate raw token, hash it, and calculate expiry
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = calculateExpiry(duration);

        // 3. Save hashed token and scope to DB
        await ShareToken.create({
            token: tokenHash,
            patientId: patientId,
            expiresAt: expiresAt,
            sharedWithEmail: sharedWithEmail || null,
            accessScope: accessScope // NEW: Save the requested access scope
        });

        // 4. Return the raw token (NOT the hash) to the client
        res.status(201).json({
            success: true,
            message: 'Share link generated successfully.',
            shareUrl: `http://localhost:3000/share/view?token=${rawToken}`,
            rawToken: rawToken,
            expiresAt: expiresAt,
            accessScope: accessScope
        });
    } catch (err) {
        console.error('Generate token error:', err);
        next(err);
    }
};

/**
 * @route GET /api/share/:token
 * @description Retrieve patient records using a valid share token (Public/Unprotected).
 */
const getRecordsByShareToken = async (req, res, next) => {
    try {
        const { token } = req.params;
        
        // 1. Hash the incoming raw token to match the database entry
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // 2. Find the token and check expiry
        const shareToken = await ShareToken.findOne({ where: { token: tokenHash } });
        
        if (!shareToken || new Date() > new Date(shareToken.expiresAt)) {
            return res.status(401).json({ success: false, message: 'Invalid or expired share token.' });
        }
        
        const accessScope = shareToken.accessScope;
        
        // 3. Retrieve patient profile for basic data (safely)
        const patientProfile = await PatientProfile.findByPk(shareToken.patientId, {
            // CRITICAL FIX: Use the 'User' alias for the nested include
            include: [{ 
                model: User, 
                as: 'User', 
                attributes: ['email'] 
            }],
            // Dynamically select attributes based on scope
            attributes: ['dateOfBirth', 'bloodGroup', 'allergies'], 
        });

        let records = [];
        
        // 4. Retrieve records only if the scope allows it
        if (['full', 'records_only'].includes(accessScope)) {
            records = await MedicalRecord.findAll({
                where: { patientId: shareToken.patientId },
                include: [
                    {
                        model: DoctorProfile,
                        as: 'DoctorProfile', // CRITICAL FIX: Use the 'DoctorProfile' alias
                        attributes: ['id', 'specialty', 'licenseNumber'],
                        include: [{ 
                            model: User, 
                            as: 'User', 
                            attributes: ['email'] 
                        }] // Include doctor's email
                    }
                ],
                order: [['recordDate', 'DESC']]
            });
        }

        // 5. Enforce Granular Scope Control: Filter patientProfile attributes if scope is restricted
        let filteredPatientData = { 
            User: patientProfile.User, // Keep the user/email link
            id: patientProfile.id
        }; 

        if (['full', 'basic', 'allergies_only'].includes(accessScope)) {
            filteredPatientData.dateOfBirth = patientProfile.dateOfBirth;
            filteredPatientData.bloodGroup = patientProfile.bloodGroup;
        }

        if (['full', 'allergies_only'].includes(accessScope)) {
             filteredPatientData.allergies = patientProfile.allergies;
        }
        
        // Final Response
        res.json({
            success: true,
            accessScope: accessScope,
            patient: filteredPatientData, // Return filtered patient data
            records: records, // Empty array if records not allowed by scope
        });
    } catch (err) {
        console.error('Shared record fetch error:', err);
        next(err);
    }
};

/**
 * @route GET /api/share/manage
 * @description Patient lists all active share tokens they created.
 * @access Private (Patient only)
 */
const listShareTokens = async (req, res, next) => {
    try {
        if (req.user.role !== 'patient') {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        // 1. Get the PatientProfile ID
        const patientProfile = await PatientProfile.findOne({ where: { userId: req.user.id } });
        if (!patientProfile) {
            return res.status(404).json({ success: false, message: 'Patient profile not found.' });
        }

        // 2. Find all active tokens associated with this PatientProfile ID
        // Improvement: Can add filtering here to only show non-expired tokens 
        const activeTokens = await ShareToken.findAll({
            where: { 
                patientId: patientProfile.id,
                // [Op.gt]: new Date() // Use this if we want to filter expired tokens at DB level
            },
            attributes: ['id', 'expiresAt', 'sharedWithEmail', 'createdAt', 'accessScope'],
            order: [['createdAt', 'DESC']]
        });

        res.json({ success: true, tokens: activeTokens });
    } catch (err) {
        next(err);
    }
};

/**
 * @route DELETE /api/share/manage/:tokenld
 * @description Patient revokes/deletes an active share token.
 * @access Private (Patient only)
 */
const revokeShareToken = async (req, res, next) => {
    try {
        const { tokenId } = req.params;
        if (req.user.role !== 'patient') {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        // 1. Get the PatientProfile ID
        const patientProfile = await PatientProfile.findOne({ where: { userId: req.user.id } });
        if (!patientProfile) {
            return res.status(404).json({ success: false, message: 'Patient profile not found.' });
        }

        // 2. Delete the token, ensuring it belongs to the current patient (CRITICAL SECURITY CHECK)
        const deletedCount = await ShareToken.destroy({
            where: {
                id: tokenId,
                patientId: patientProfile.id // Prevents patient from deleting another patient's token
            }
        });

        if (deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'Token not found or unauthorized.' });
        }

        res.json({ success: true, message: 'Share token successfully revoked.' });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    generateShareToken,
    getRecordsByShareToken,
    listShareTokens,
    revokeShareToken
};