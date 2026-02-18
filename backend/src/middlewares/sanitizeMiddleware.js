// backend/src/middlewares/sanitizeMiddleware.js

const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');

/**
 * Sanitize user input to prevent XSS and NoSQL injection
 */
const sanitizeInput = (req, res, next) => {
  // Sanitize request body, query params, and URL params
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};

/**
 * Recursively sanitize object values
 */
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
  }
  return sanitized;
};

/**
 * Sanitize string values
 */
const sanitizeString = (value) => {
  if (typeof value !== 'string') {
    return value;
  }

  // Remove HTML tags and dangerous characters
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove <script> tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove <iframe> tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
    .trim();
};

module.exports = {
  sanitizeInput,
  xssClean: xss(),
  mongoSanitize: mongoSanitize()
};