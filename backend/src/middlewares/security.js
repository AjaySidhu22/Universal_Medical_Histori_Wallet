// backend/src/middlewares/security.js

const rateLimit = require('express-rate-limit');

// Authentication rate limiter (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
  message: 'Too many login attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Password reset rate limiter
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset requests per hour
  message: 'Too many password reset attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'Too many requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload rate limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: 'Too many file uploads. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Record creation rate limiter
const recordCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 records per hour
  message: 'Too many records created. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Access request rate limiter
const accessRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 access requests per hour
  message: 'Too many access requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// QR code generation rate limiter
const qrLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 QR codes per hour
  message: 'Too many QR code generations. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  apiLimiter,
  uploadLimiter,
  recordCreationLimiter,
  accessRequestLimiter,
  qrLimiter,
  passwordResetLimiter 
};