//backend/src/controllers/authController.js

const authService = require('../services/authService');

 // POST /api/auth/register
const registerUser = async (req, res, next) => {
  try {
    const { email, password, role, username } = req.body;

    // Register user (atomic operation)
    const user = await authService.register(email, password, role, username);  // ✅ FIXED

    res.status(201).json({
      message: 'Verification email sent! Please check your inbox and enter the code to complete registration.',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      },
      emailSent: true
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/verify-email
const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({
        error: 'Email and OTP are required'
      });
    }
    
    const result = await authService.verifyEmailOTP(email, otp);
    
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/resend-otp
const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        error: 'Email is required'
      });
    }
    
    const result = await authService.sendVerificationOTP(email);
    
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken, refreshTokenExpiry } = await authService.login(email, password);
    
    // ✅ Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({
        error: 'Email not verified',
        message: 'Please verify your email before logging in. Check your inbox for the verification code.',
        email: user.email,
        requiresVerification: true
      });
    }
    
    // ✅ NEW: Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      return res.status(200).json({
        requires2FA: true,
        userId: user.id,
        email: user.email,
        message: 'Please enter your 2FA code to continue.'
      });
    }
    
    // No 2FA - proceed with normal login
    res
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: refreshTokenExpiry
      })
      .cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(Date.now() + 15 * 60 * 1000)
      })
      .json({
        message: 'Login successful!',
        user: { id: user.id, email: user.email, role: user.role },
        accessToken
      });
  } catch (err) {
    next(err);
  }
};
 
// POST /api/auth/refresh-token
const refreshAccessToken = async (req, res, next) => {
  try {
    const { accessToken, refreshToken, refreshTokenExpiry } = await authService.rotateRefreshToken(req.cookies.refreshToken);

    res
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: refreshTokenExpiry
      })
      .cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(Date.now() + 15 * 60 * 1000)
      })
      .json({ accessToken, message: 'New access token granted.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
const logoutUser = async (req, res, next) => {
  try {
    // ✅ FIXED: Only call logout service if refresh token exists
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    
    // Clear cookies regardless of whether token existed
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/request-password-reset
const requestPasswordReset = async (req, res, next) => {
  try {
    await authService.initiatePasswordReset(req.body.email); // ✅ FIXED: initiatePasswordReset instead of generateResetToken
    res.status(200).json({ 
      message: 'If this email exists, a password reset link has been sent.' 
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    await authService.completePasswordReset(token, password); // ✅ FIXED: completePasswordReset instead of resetPassword
    res.status(200).json({ 
      message: 'Password has been reset successfully' 
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/2fa/enable
const enable2FA = async (req, res, next) => {
  try {
    const userId = req.user.id; // From auth middleware
    
    const result = await authService.enable2FA(userId);
    
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/2fa/verify
const verify2FA = async (req, res, next) => {
  try {
    const userId = req.user.id; // From auth middleware
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        error: 'Verification token is required'
      });
    }
    
    const result = await authService.verify2FA(userId, token);
    
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/2fa/disable
const disable2FA = async (req, res, next) => {
  try {
    const userId = req.user.id; // From auth middleware
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        error: 'Password is required to disable 2FA'
      });
    }
    
    const result = await authService.disable2FA(userId, password);
    
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/2fa/verify-login
const verify2FALogin = async (req, res, next) => {
  try {
    const { userId, token, isBackupCode } = req.body;
    
    if (!userId || !token) {
      return res.status(400).json({
        error: 'User ID and token are required'
      });
    }
    
    const result = await authService.verify2FALogin(userId, token, isBackupCode);
    
    // Generate tokens after successful 2FA verification
    const { generateTokens } = require('../utils/tokenUtils');
    const User = require('../models').User;
    const user = await User.findByPk(userId);
    
    const { accessToken, refreshToken, refreshTokenExpiry } = generateTokens(user);
    
    user.refreshToken = refreshToken;
    user.refreshTokenExpiry = refreshTokenExpiry;
    await user.save();
    
    res
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: refreshTokenExpiry
      })
      .cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(Date.now() + 15 * 60 * 1000)
      })
      .json({
        message: 'Login successful!',
        user: { id: user.id, email: user.email, role: user.role },
        accessToken
      });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/2fa/regenerate-backup-codes
const regenerateBackupCodes = async (req, res, next) => {
  try {
    const userId = req.user.id; // From auth middleware
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        error: 'Password is required'
      });
    }
    
    const result = await authService.regenerateBackupCodes(userId, password);
    
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/check-username?username=john_smith
const checkUsernameAvailability = async (req, res, next) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({
        error: 'Username is required'
      });
    }

    // Validate username format
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({
        available: false,
        error: 'Username must be between 3 and 30 characters'
      });
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return res.status(400).json({
        available: false,
        error: 'Username can only contain letters, numbers, underscores, and dashes'
      });
    }

    const { User } = require('../models');
    const existingUser = await User.findOne({
      where: { username: username.toLowerCase() }
    });

    if (existingUser) {
      // Generate suggestions
      const suggestions = [];
      const baseUsername = username.toLowerCase();
      
      for (let i = 1; i <= 3; i++) {
        const suggestion = `${baseUsername}${Math.floor(Math.random() * 1000)}`;
        const exists = await User.findOne({ where: { username: suggestion } });
        if (!exists) {
          suggestions.push(suggestion);
        }
      }

      return res.status(200).json({
        available: false,
        message: 'Username is already taken',
        suggestions
      });
    }

    res.status(200).json({
      available: true,
      message: 'Username is available!'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  resendOTP,
  enable2FA,                   
  verify2FA,                   
  disable2FA,                  
  verify2FALogin,              
  regenerateBackupCodes,
  checkUsernameAvailability       
};