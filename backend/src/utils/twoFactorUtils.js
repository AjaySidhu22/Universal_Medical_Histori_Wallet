// backend/src/utils/twoFactorUtils.js

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { encrypt, decrypt } = require('./encryption');

/**
 * Generate a new 2FA secret for a user
 * @param {string} userEmail - User's email address
 * @returns {Object} { secret, qrCodeUrl, backupCodes }
 */
const generate2FASecret = async (userEmail) => {
  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `Universal Medical Wallet (${userEmail})`,
    issuer: 'Universal Medical Wallet',
    length: 32
  });

  // Generate QR code as data URL
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  // Generate 10 backup codes
  const backupCodes = generateBackupCodes(10);

  return {
    secret: secret.base32, // This is what we'll store (encrypted)
    qrCodeUrl,             // This is what we'll show to user
    backupCodes            // These are for recovery
  };
};

/**
 * Generate backup codes for 2FA recovery
 * @param {number} count - Number of backup codes to generate
 * @returns {Array<string>} Array of backup codes
 */
const generateBackupCodes = (count = 10) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  return codes;
};

/**
 * Verify a 2FA token
 * @param {string} encryptedSecret - Encrypted secret from database
 * @param {string} token - 6-digit token from user
 * @returns {boolean} True if token is valid
 */
const verify2FAToken = (encryptedSecret, token) => {
  try {
    const secret = decrypt(encryptedSecret);
    
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps before/after (60 seconds tolerance)
    });

    return verified;
  } catch (error) {
    console.error('2FA verification error:', error);
    return false;
  }
};

/**
 * Verify a backup code
 * @param {string} encryptedBackupCodes - Encrypted backup codes JSON from database
 * @param {string} code - Backup code from user
 * @returns {Object} { valid: boolean, remainingCodes: Array }
 */
const verifyBackupCode = (encryptedBackupCodes, code) => {
  try {
    const decryptedJson = decrypt(encryptedBackupCodes);
    const backupCodes = JSON.parse(decryptedJson);
    
    const codeIndex = backupCodes.indexOf(code.toUpperCase());
    
    if (codeIndex === -1) {
      return { valid: false, remainingCodes: backupCodes };
    }
    
    // Remove used code
    backupCodes.splice(codeIndex, 1);
    
    return { valid: true, remainingCodes: backupCodes };
  } catch (error) {
    console.error('Backup code verification error:', error);
    return { valid: false, remainingCodes: [] };
  }
};

/**
 * Encrypt 2FA secret for storage
 * @param {string} secret - Plain secret
 * @returns {string} Encrypted secret
 */
const encrypt2FASecret = (secret) => {
  return encrypt(secret);
};

/**
 * Encrypt backup codes for storage
 * @param {Array<string>} codes - Array of backup codes
 * @returns {string} Encrypted JSON string
 */
const encryptBackupCodes = (codes) => {
  return encrypt(JSON.stringify(codes));
};

/**
 * Decrypt backup codes from storage
 * @param {string} encryptedCodes - Encrypted backup codes
 * @returns {Array<string>} Array of backup codes
 */
const decryptBackupCodes = (encryptedCodes) => {
  const decrypted = decrypt(encryptedCodes);
  return JSON.parse(decrypted);
};

module.exports = {
  generate2FASecret,
  generateBackupCodes,
  verify2FAToken,
  verifyBackupCode,
  encrypt2FASecret,
  encryptBackupCodes,
  decryptBackupCodes
};