// backend/src/utils/tokenUtils.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = crypto.randomBytes(40).toString('hex');
  const refreshTokenExpiry = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  return { accessToken, refreshToken, refreshTokenExpiry };
};

module.exports = { generateTokens };

