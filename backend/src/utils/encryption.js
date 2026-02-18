// backend/src/utils/encryption.js

const crypto = require('crypto');

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

/**
 * Get encryption key from environment
 * @returns {Buffer} Encryption key
 */
const getKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY not found in environment variables');
  }
  // Create a 32-byte key from the environment variable
  return crypto.createHash('sha256').update(key).digest();
};

/**
 * Encrypt a string value
 * @param {string} text - Plain text to encrypt
 * @returns {string} Encrypted text in hex format
 */
const encrypt = (text) => {
  if (!text) return null;
  
  try {
    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(String(text), 'utf8'),
      cipher.final()
    ]);

    const tag = cipher.getAuthTag();

    // Combine salt + iv + tag + encrypted data
    return Buffer.concat([salt, iv, tag, encrypted]).toString('hex');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt an encrypted string
 * @param {string} encryptedHex - Encrypted text in hex format
 * @returns {string} Decrypted plain text
 */
const decrypt = (encryptedHex) => {
  if (!encryptedHex) return null;

  try {
    const key = getKey();
    const encryptedBuffer = Buffer.from(encryptedHex, 'hex');

    const salt = encryptedBuffer.subarray(0, SALT_LENGTH);
    const iv = encryptedBuffer.subarray(SALT_LENGTH, TAG_POSITION);
    const tag = encryptedBuffer.subarray(TAG_POSITION, ENCRYPTED_POSITION);
    const encrypted = encryptedBuffer.subarray(ENCRYPTED_POSITION);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);

    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Hash a value (one-way, cannot be decrypted)
 * @param {string} text - Text to hash
 * @returns {string} Hashed value
 */
const hash = (text) => {
  if (!text) return null;
  return crypto.createHash('sha256').update(String(text)).digest('hex');
};

module.exports = {
  encrypt,
  decrypt,
  hash
};