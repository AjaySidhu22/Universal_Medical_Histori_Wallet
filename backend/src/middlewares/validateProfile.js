// backend/src/middlewares/validateProfile.js

/**
 * Middleware that validates the fields submitted for a profile update based on the user's role.
 * Ensures no extraneous or sensitive fields are submitted.
 * @module validateProfile
 */
module.exports = async (req, res, next) => {
    const { role } = req.user;
    const body = req.body;
    
    // --- 1. Security: Remove read-only/system fields from the body payload ---
    const readOnlyFields = ['id', 'userId', 'createdAt', 'updatedAt'];
    readOnlyFields.forEach(field => delete body[field]);

    // --- 2. Role-Based Field Validation ---
    
    let allowedFields = [];
    let messagePrefix;

    if (role === 'doctor') {
        allowedFields = ['specialty', 'licenseNumber', 'isVerified']; // Include isVerified for completeness (though only admin should set it)
        messagePrefix = 'doctor';
    } else if (role === 'patient') {
        allowedFields = [
            'dateOfBirth', 
            'bloodGroup', 
            'allergies', 
            'emergencyContactName',
            'emergencyContactNumber'
        ];
        messagePrefix = 'patient';
    } else {
        // If the role is 'admin', they should manage users, not update profiles via this route.
        return res.status(403).json({ message: 'Profile update is not allowed for your role.' });
    }

    const invalid = Object.keys(body).filter(key => !allowedFields.includes(key));

    if (invalid.length > 0) {
        // Return 400 Bad Request for sending fields not belonging to the profile schema
        return res.status(400).json({ 
            success: false,
            message: `Invalid fields submitted for ${messagePrefix}: ${invalid.join(', ')}` 
        });
    }
    
    // FUTURE IMPROVEMENT: Apply sanitization here if express-validator wasn't used upstream.
    
    next();
};