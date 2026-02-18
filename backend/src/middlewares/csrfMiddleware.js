// backend/src/middlewares/csrfMiddleware.js

const crypto = require('crypto');

// In-memory token store (in production, use Redis or database)
const tokenStore = new Map();

// Token expiration time (15 minutes)
const TOKEN_EXPIRY = 15 * 60 * 1000;

/**
 * Clean up expired tokens periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of tokenStore.entries()) {
    if (data.expiresAt < now) {
      tokenStore.delete(token);
    }
  }
}, 5 * 60 * 1000); // Cleanup every 5 minutes

/**
 * Generate a CSRF token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {string} CSRF token
 */
const generateToken = (req, res) => {
  // Generate cryptographically secure random token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Store token with expiration
  tokenStore.set(token, {
    createdAt: Date.now(),
    expiresAt: Date.now() + TOKEN_EXPIRY
  });
  
  return token;
};

/**
 * Validate CSRF token from request header
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
const validateToken = (req, res, next) => {
  // Get token from header
  const token = req.headers['x-csrf-token'];
  
  if (!token) {
    return res.status(403).json({
      error: 'CSRF token missing',
      message: 'No CSRF token provided in request header'
    });
  }
  
  // Check if token exists and is valid
  const tokenData = tokenStore.get(token);
  
  if (!tokenData) {
    return res.status(403).json({
      error: 'Invalid CSRF token',
      message: 'CSRF token is invalid or expired'
    });
  }
  
  // Check if token is expired
  if (tokenData.expiresAt < Date.now()) {
    tokenStore.delete(token);
    return res.status(403).json({
      error: 'CSRF token expired',
      message: 'CSRF token has expired, please refresh and try again'
    });
  }
  
  // Token is valid, proceed
  next();
};

/**
 * Middleware to protect routes from CSRF attacks
 * Only validates on state-changing methods (POST, PUT, DELETE, PATCH)
 */
const csrfProtection = (req, res, next) => {
  // Skip CSRF validation for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Validate token for state-changing methods
  validateToken(req, res, next);
};

module.exports = {
  generateToken,
  csrfProtection
};