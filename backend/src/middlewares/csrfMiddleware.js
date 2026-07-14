// backend/src/middlewares/csrfMiddleware.js

const crypto = require('crypto');

const SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a stateless CSRF token
 * Format: timestamp.hmac
 */
const generateToken = (req, res) => {
  const timestamp = Date.now().toString();
  const hmac = crypto
    .createHmac('sha256', SECRET)
    .update(timestamp)
    .digest('hex');
  return `${timestamp}.${hmac}`;
};

/**
 * Validate CSRF token from request header
 */
const validateToken = (req, res, next) => {
  const token = req.headers['x-csrf-token'];

  if (!token) {
    return res.status(403).json({
      error: 'CSRF token missing',
      message: 'No CSRF token provided in request header'
    });
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return res.status(403).json({
      error: 'Invalid CSRF token',
      message: 'CSRF token is invalid or expired'
    });
  }

  const [timestamp, hmac] = parts;

  // Check expiry
  if (Date.now() - parseInt(timestamp) > TOKEN_EXPIRY) {
    return res.status(403).json({
      error: 'CSRF token expired',
      message: 'CSRF token has expired, please refresh and try again'
    });
  }

  // Verify HMAC
  const expectedHmac = crypto
    .createHmac('sha256', SECRET)
    .update(timestamp)
    .digest('hex');

  const valid = crypto.timingSafeEqual(
    Buffer.from(hmac),
    Buffer.from(expectedHmac)
  );

  if (!valid) {
    return res.status(403).json({
      error: 'Invalid CSRF token',
      message: 'CSRF token is invalid or expired'
    });
  }

  next();
};

/**
 * Middleware to protect routes from CSRF attacks
 * Only validates on state-changing methods (POST, PUT, DELETE, PATCH)
 */
const csrfProtection = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  validateToken(req, res, next);
};

module.exports = {
  generateToken,
  csrfProtection
};