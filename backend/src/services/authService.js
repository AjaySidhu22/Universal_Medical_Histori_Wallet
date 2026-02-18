//  backend/src/services/authService.js

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { sendPasswordResetEmail } = require('../utils/emailService');
const { sendResetEmail } = require('../utils/emailService');
const { generateTokens } = require('../utils/tokenUtils');
const { hashResetToken, compareResetToken } = require('../utils/cryptoUtils');
const db = require('../models'); // ✅ FIXED: Changed from ../../models to ../models
const { 
  generateOTP, 
  encryptOTP, 
  decryptOTP, 
  getOTPExpiryTime, 
  isOTPExpired, 
  verifyOTP, 
  canRequestOTP,
  getOTPResetTime
} = require('../utils/otpUtils');
const {
  generate2FASecret,
  verify2FAToken,
  verifyBackupCode,
  encrypt2FASecret,
  encryptBackupCodes,
  decryptBackupCodes
} = require('../utils/twoFactorUtils');
const { sendVerificationEmail } = require('../utils/emailService');
const User = db.User;

// REGISTER (ATOMIC - Email sent BEFORE account creation)
const register = async (email, password, role, username) => {
  // Step 1: Check if email exists
  const existingEmail = await User.findOne({ where: { email } });
  if (existingEmail) {
    // If verified, can't register
    if (existingEmail.isEmailVerified) {
      throw new Error('User already exists.');
    } else {
      // Delete unverified account to allow re-registration
      await existingEmail.destroy();
    }
  }

  // Step 2: Check if username exists
  if (username) {
    const existingUsername = await User.findOne({ 
      where: { username: username.toLowerCase() } 
    });
    if (existingUsername && existingUsername.isEmailVerified) {
      throw new Error('Username is already taken.');
    } else if (existingUsername && !existingUsername.isEmailVerified) {
      // Username belongs to unverified account
      if (existingUsername.email !== email) {
        throw new Error('Username is already taken.');
      }
    }
  }

  const finalRole = ['patient', 'doctor'].includes(role) ? role : 'patient';
  if (finalRole === 'admin') throw new Error('Cannot register with admin role.');

  // Step 3: Generate OTP
  const otp = generateOTP();
  const encryptedOtp = encryptOTP(otp);
  const otpExpiresAt = getOTPExpiryTime();

  // Step 4: Send email FIRST (atomic operation - this must succeed)
  try {
    await sendVerificationEmail(email, otp);
  } catch (emailError) {
    console.error('Email sending failed:', emailError);
    throw new Error('Failed to send verification email. Please check your email address and try again.');
  }

  // Step 5: Create user ONLY after email succeeds
  const user = await User.create({ 
    email, 
    password, 
    role: finalRole,
    username: username ? username.toLowerCase() : null,
    emailVerificationOtp: encryptedOtp,
    otpExpiresAt: otpExpiresAt,
    otpAttempts: 1,
    otpAttemptsResetAt: getOTPResetTime()
  });
  
  // Return user directly (controller expects user object)
  return user;
};

// LOGIN
const login = async (email, password) => {
  const user = await User.findOne({ where: { email } });
  if (!user || !(await user.comparePassword(password))) {
    throw new Error('Invalid credentials.');
  }

  const { accessToken, refreshToken, refreshTokenExpiry } = generateTokens(user);
  user.refreshToken = refreshToken;
  user.refreshTokenExpiry = refreshTokenExpiry;
  await user.save();

  return { user, accessToken, refreshToken, refreshTokenExpiry };
};

// REFRESH TOKEN
const rotateRefreshToken = async (oldToken) => {
  const user = await User.findOne({ where: { refreshToken: oldToken } });
  if (!user) throw new Error('Invalid refresh token.');
  if (new Date() > new Date(user.refreshTokenExpiry)) {
    user.refreshToken = null;
    user.refreshTokenExpiry = null;
    await user.save();
    throw new Error('Refresh token expired.');
  }

  const { accessToken, refreshToken, refreshTokenExpiry } = generateTokens(user);
  user.refreshToken = refreshToken;
  user.refreshTokenExpiry = refreshTokenExpiry;
  await user.save();

  return { accessToken, refreshToken, refreshTokenExpiry };
};

// LOGOUT
const logout = async (refreshToken) => {
  const user = await User.findOne({ where: { refreshToken } });
  if (user) {
    user.refreshToken = null;
    user.refreshTokenExpiry = null;
    await user.save();
  }
};

// PASSWORD RESET - STEP 1
const initiatePasswordReset = async (email) => {
  const user = await User.findOne({ where: { email } });
  if (!user) return; // Silent success for security

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashed = hashResetToken(rawToken);

  user.resetToken = hashed;
  user.resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
  await user.save();

  // Build reset URL
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${rawToken}`;
  await sendPasswordResetEmail(user.email, resetUrl);
};

// PASSWORD RESET - STEP 2
const completePasswordReset = async (token, newPassword) => {
  const hashed = hashResetToken(token);
  const user = await User.findOne({ where: { resetToken: hashed } });

  if (!user || new Date() > new Date(user.resetTokenExpiry)) {
    throw new Error('Invalid or expired token.');
  }

  user.password = newPassword;
  user.resetToken = null;
  user.resetTokenExpiry = null;
  await user.save();
};

// EMAIL VERIFICATION - SEND OTP
const sendVerificationOTP = async (email) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new Error('User not found.');
  }

  // Check if already verified
  if (user.isEmailVerified) {
    throw new Error('Email already verified.');
  }

  // Check rate limiting
  const { canRequest, attemptsRemaining, resetTime } = canRequestOTP(user);
  if (!canRequest) {
    const minutesRemaining = Math.ceil((new Date(resetTime) - new Date()) / 60000);
    throw new Error(`Too many OTP requests. Please try again in ${minutesRemaining} minutes.`);
  }

  // Generate and encrypt OTP
  const otp = generateOTP();
  const encryptedOtp = encryptOTP(otp);

  // Update user with OTP
  user.emailVerificationOtp = encryptedOtp;
  user.otpExpiresAt = getOTPExpiryTime();
  
  // Update rate limiting
  if (!user.otpAttemptsResetAt || new Date() > new Date(user.otpAttemptsResetAt)) {
    user.otpAttempts = 1;
    user.otpAttemptsResetAt = getOTPResetTime();
  } else {
    user.otpAttempts += 1;
  }

  await user.save();

  // Send OTP email
  await sendVerificationEmail(user.email, otp);

  return {
    message: 'Verification OTP sent to your email.',
    attemptsRemaining: attemptsRemaining - 1
  };
};

// EMAIL VERIFICATION - VERIFY OTP
const verifyEmailOTP = async (email, providedOtp) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new Error('User not found.');
  }

  // Check if already verified
  if (user.isEmailVerified) {
    throw new Error('Email already verified.');
  }

  // Check if OTP exists
  if (!user.emailVerificationOtp || !user.otpExpiresAt) {
    throw new Error('No OTP found. Please request a new one.');
  }

  // Check if OTP expired
  if (isOTPExpired(user.otpExpiresAt)) {
    // Clear expired OTP
    user.emailVerificationOtp = null;
    user.otpExpiresAt = null;
    await user.save();
    throw new Error('OTP has expired. Please request a new one.');
  }

  // Verify OTP
  const isValid = verifyOTP(providedOtp, user.emailVerificationOtp);
  if (!isValid) {
    throw new Error('Invalid OTP. Please try again.');
  }

  // Mark email as verified
  user.isEmailVerified = true;
  user.emailVerificationOtp = null;
  user.otpExpiresAt = null;
  user.otpAttempts = 0;
  user.otpAttemptsResetAt = null;
  await user.save();

  return {
    message: 'Email verified successfully!',
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified
    }
  };
};

// 2FA - ENABLE 2FA
const enable2FA = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found.');
  }

  if (user.twoFactorEnabled) {
    throw new Error('2FA is already enabled.');
  }

  // Generate secret and QR code
  const { secret, qrCodeUrl, backupCodes } = await generate2FASecret(user.email);

  // Encrypt and store secret (but don't enable yet - user must verify first)
  const encryptedSecret = encrypt2FASecret(secret);
  const encryptedBackupCodes = encryptBackupCodes(backupCodes);

  user.twoFactorSecret = encryptedSecret;
  user.backupCodes = encryptedBackupCodes;
  await user.save();

  return {
    qrCodeUrl,
    backupCodes,
    message: 'Scan the QR code with Google Authenticator and enter a code to verify.'
  };
};

// 2FA - VERIFY AND ACTIVATE 2FA
const verify2FA = async (userId, token) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found.');
  }

  if (user.twoFactorEnabled) {
    throw new Error('2FA is already enabled.');
  }

  if (!user.twoFactorSecret) {
    throw new Error('2FA setup not initiated. Please enable 2FA first.');
  }

  // Verify the token
  const isValid = verify2FAToken(user.twoFactorSecret, token);
  if (!isValid) {
    throw new Error('Invalid verification code.');
  }

  // Enable 2FA
  user.twoFactorEnabled = true;
  await user.save();

  return {
    message: '2FA enabled successfully!',
    twoFactorEnabled: true
  };
};

// 2FA - DISABLE 2FA
const disable2FA = async (userId, password) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found.');
  }

  // Verify password
  const isValidPassword = await user.comparePassword(password);
  if (!isValidPassword) {
    throw new Error('Invalid password.');
  }

  // Disable and clear 2FA data
  user.twoFactorEnabled = false;
  user.twoFactorSecret = null;
  user.backupCodes = null;
  await user.save();

  return {
    message: '2FA disabled successfully.',
    twoFactorEnabled: false
  };
};

// 2FA - VERIFY 2FA TOKEN DURING LOGIN
const verify2FALogin = async (userId, token, isBackupCode = false) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found.');
  }

  if (!user.twoFactorEnabled) {
    throw new Error('2FA is not enabled for this user.');
  }

  let isValid = false;

  if (isBackupCode) {
    // Verify backup code
    const { valid, remainingCodes } = verifyBackupCode(user.backupCodes, token);
    isValid = valid;

    if (isValid) {
      // Update remaining backup codes
      user.backupCodes = encryptBackupCodes(remainingCodes);
      await user.save();
    }
  } else {
    // Verify TOTP token
    isValid = verify2FAToken(user.twoFactorSecret, token);
  }

  if (!isValid) {
    throw new Error('Invalid verification code.');
  }

  return {
    message: '2FA verification successful.',
    verified: true
  };
};

// 2FA - REGENERATE BACKUP CODES
const regenerateBackupCodes = async (userId, password) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found.');
  }

  if (!user.twoFactorEnabled) {
    throw new Error('2FA is not enabled.');
  }

  // Verify password
  const isValidPassword = await user.comparePassword(password);
  if (!isValidPassword) {
    throw new Error('Invalid password.');
  }

  // Generate new backup codes
  const { generateBackupCodes } = require('../utils/twoFactorUtils');
  const newBackupCodes = generateBackupCodes(10);
  
  user.backupCodes = encryptBackupCodes(newBackupCodes);
  await user.save();

  return {
    backupCodes: newBackupCodes,
    message: 'Backup codes regenerated successfully.'
  };
};
module.exports = {
  register,
  login,
  rotateRefreshToken,
  logout,
  initiatePasswordReset,
  completePasswordReset,
  sendVerificationOTP,
  verifyEmailOTP,
  enable2FA,               
  verify2FA,               
  disable2FA,              
  verify2FALogin,          
  regenerateBackupCodes 
};