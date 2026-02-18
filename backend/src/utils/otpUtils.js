// backend/src/utils/otpUtils.js

const crypto = require('crypto');
const { encrypt, decrypt } = require('./encryption');

// OTP configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS_PER_HOUR = 3;

/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP
 */
const generateOTP = () => {
  // Generate cryptographically secure random 6-digit number
  const otp = crypto.randomInt(100000, 999999).toString();
  return otp;
};

/**
 * Encrypt OTP for storage
 * @param {string} otp - Plain OTP to encrypt
 * @returns {string} Encrypted OTP
 */
const encryptOTP = (otp) => {
  return encrypt(otp);
};

/**
 * Decrypt OTP for verification
 * @param {string} encryptedOtp - Encrypted OTP from database
 * @returns {string} Decrypted OTP
 */
const decryptOTP = (encryptedOtp) => {
  return decrypt(encryptedOtp);
};

/**
 * Get OTP expiration time
 * @returns {Date} Expiration timestamp
 */
const getOTPExpiryTime = () => {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
};

/**
 * Check if OTP is expired
 * @param {Date} expiryTime - OTP expiry timestamp
 * @returns {boolean} True if expired
 */
const isOTPExpired = (expiryTime) => {
  return new Date() > new Date(expiryTime);
};

/**
 * Verify OTP matches
 * @param {string} providedOtp - OTP provided by user
 * @param {string} encryptedStoredOtp - Encrypted OTP from database
 * @returns {boolean} True if OTP matches
 */
const verifyOTP = (providedOtp, encryptedStoredOtp) => {
  try {
    const decryptedOtp = decryptOTP(encryptedStoredOtp);
    return providedOtp === decryptedOtp;
  } catch (error) {
    console.error('OTP verification error:', error);
    return false;
  }
};

/**
 * Check if user can request another OTP (rate limiting)
 * @param {Object} user - User model instance
 * @returns {Object} { canRequest: boolean, attemptsRemaining: number, resetTime: Date }
 */
const canRequestOTP = (user) => {
  const now = new Date();
  
  // Reset attempts if reset time has passed
  if (!user.otpAttemptsResetAt || now > new Date(user.otpAttemptsResetAt)) {
    return {
      canRequest: true,
      attemptsRemaining: MAX_OTP_ATTEMPTS_PER_HOUR,
      resetTime: new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now
    };
  }
  
  // Check if attempts exceeded
  if (user.otpAttempts >= MAX_OTP_ATTEMPTS_PER_HOUR) {
    return {
      canRequest: false,
      attemptsRemaining: 0,
      resetTime: user.otpAttemptsResetAt
    };
  }
  
  return {
    canRequest: true,
    attemptsRemaining: MAX_OTP_ATTEMPTS_PER_HOUR - user.otpAttempts,
    resetTime: user.otpAttemptsResetAt
  };
};

/**
 * Get OTP rate limit reset time (1 hour from now)
 * @returns {Date} Reset timestamp
 */
const getOTPResetTime = () => {
  return new Date(Date.now() + 60 * 60 * 1000); // 1 hour
};

module.exports = {
  generateOTP,
  encryptOTP,
  decryptOTP,
  getOTPExpiryTime,
  isOTPExpired,
  verifyOTP,
  canRequestOTP,
  getOTPResetTime,
  OTP_EXPIRY_MINUTES,
  MAX_OTP_ATTEMPTS_PER_HOUR
};
