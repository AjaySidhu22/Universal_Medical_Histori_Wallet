// backend/src/middlewares/errorMiddleware.js

const logger = require('../utils/logger');

/**
 * Centralized Error Handler Middleware
 * Logs errors and sends sanitized responses to clients
 */
const errorHandler = (err, req, res, next) => {
  // Determine status code
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Log error details (full stack in development)
  const errorLog = {
    statusCode,
    message,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: req.user?.id || 'unauthenticated',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  };

  if (statusCode >= 500) {
    logger.error('Server Error:', errorLog);
  } else {
    logger.warn('Client Error:', errorLog);
  }

  // Sanitize error messages in production
  if (process.env.NODE_ENV === 'production') {
    // Hide database errors
    if (message.includes('ECONNREFUSED') || message.includes('database')) {
      message = 'Database error. Please try again later.';
    }

    // Hide file paths
    if (message.includes('/')) {
      message = 'An internal error occurred. Please contact support.';
    }
  }

  // Handle specific error types
  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = err.errors.map(e => e.message).join(', ') || 'Validation failed.';
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    const field = Object.keys(err.fields || {})[0];
    message = field 
      ? `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`
      : 'Duplicate entry.';
  }

  if (err.name === 'SequelizeEagerLoadingError') {
    statusCode = 500;
    message = process.env.NODE_ENV === 'production'
      ? 'Server configuration error.'
      : err.message;
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired. Please log in again.';
  }

  if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.code === 'LIMIT_FILE_SIZE'
      ? 'File too large. Maximum size is 10MB.'
      : 'File upload error.';
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

module.exports = errorHandler;