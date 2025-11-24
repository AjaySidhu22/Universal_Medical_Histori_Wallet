// // backend/src/middlewares/requireAdmin.js

// module.exports = (req, res, next) => {
//   if (!req.user || req.user.role !== 'admin') {
//     return res.status(403).json({ message: 'Access denied. Admins only.' });
//   }
//   next();
// };



/**
 * Authorization Middleware: Ensures the authenticated user has the 'admin' role.
 * Relies on the 'protect' middleware running first to populate req.user.
 * @module requireAdmin
 */
module.exports = async (req, res, next) => {
    // 1. Check if user object exists (implies token was provided)
    // 2. Check if the user's role is strictly 'admin'
    if (!req.user || req.user.role !== 'admin') {
        // 403 Forbidden: User is authenticated but lacks necessary privileges.
        return res.status(403).json({ 
            success: false, 
            message: 'Access denied. Administrator privileges required.' 
        });
    }
    
    // Authorization successful
    next();
};