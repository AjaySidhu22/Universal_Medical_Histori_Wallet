// backend/src/utils/cryptoUtils.js 

const crypto = require('crypto');

// Hashes a token with SHA256
const hashResetToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Compares hashed token with stored hash (useful if you store hashed token and need to check user-provided one)
const compareResetToken = (raw, hashed) => {
  const rawHashed = hashResetToken(raw);
  return rawHashed === hashed;
};

module.exports = { hashResetToken, compareResetToken };
