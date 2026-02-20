// backend/src/utils/emailService.js

const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    logger.error('Email transporter verification failed:', error);
  } else {
    logger.info('✅ Email service is ready to send emails');
  }
});

/**
 * HTML Email Template Generator
 */
const generateEmailTemplate = (title, content, actionButton = null) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 30px 20px;
    }
    .action-button {
      display: inline-block;
      padding: 12px 30px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
    }
    .info-box {
      background: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 20px 0;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .warning {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 Universal Medical Wallet</h1>
    </div>
    <div class="content">
      ${content}
      ${actionButton || ''}
    </div>
    <div class="footer">
      <p>This is an automated email from Universal Medical Wallet.</p>
      <p>If you have any questions, please contact your healthcare provider.</p>
      <p>&copy; ${new Date().getFullYear()} Universal Medical Wallet. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Send Access Request Email to Patient
 */
const sendAccessRequestEmail = async (patientEmail, doctorProfile, accessRequest) => {
  try {
    const content = `
      <h2>📋 New Access Request</h2>
      <p>Hello,</p>
      <p>A doctor has requested access to your medical records.</p>
      
      <div class="info-box">
        <h3>Doctor Information:</h3>
        <p><strong>Name:</strong> ${doctorProfile.name || 'Not provided'}</p>
        <p><strong>Email:</strong> ${doctorProfile.User?.email || 'Not available'}</p>
        <p><strong>Specialty:</strong> ${doctorProfile.specialty || 'Not specified'}</p>
        <p><strong>License Number:</strong> ${doctorProfile.licenseNumber || 'Not provided'}</p>
        ${doctorProfile.hospitalName ? `<p><strong>Hospital:</strong> ${doctorProfile.hospitalName}</p>` : ''}
      </div>

      <div class="info-box">
        <h3>Request Details:</h3>
        <p><strong>Access Type:</strong> ${accessRequest.requestType === 'both' ? 'View & Create Records' : accessRequest.requestType === 'create' ? 'Create Records Only' : 'View Records Only'}</p>
        <p><strong>Reason:</strong> ${accessRequest.reason || 'Not provided'}</p>
        <p><strong>Requested Duration:</strong> ${calculateDuration(accessRequest.expiresAt)}</p>
        <p><strong>Expires:</strong> ${new Date(accessRequest.expiresAt).toLocaleString()}</p>
      </div>

      <div class="warning">
        <p><strong>⚠️ Important:</strong></p>
        <p>Please review this request carefully before approving. You can customize the access duration when approving.</p>
      </div>

      <p style="text-align: center;">
        <a href="${process.env.FRONTEND_URL}/dashboard" class="action-button">
          📱 Review Request on Dashboard
        </a>
      </p>

      <p>You can approve or deny this request from your dashboard.</p>
    `;

    const mailOptions = {
      from: `"Universal Medical Wallet" <${process.env.EMAIL_USER}>`,
      to: patientEmail,
      subject: '🏥 New Medical Record Access Request',
      html: generateEmailTemplate('New Access Request', content)
    };

    const info = await transporter.sendMail(mailOptions);
    
    logger.info('Access request email sent', { 
      to: patientEmail,
      messageId: info.messageId,
      doctorId: doctorProfile.id,
      requestId: accessRequest.id
    });

    return { success: true, messageId: info.messageId };

  } catch (error) {
    logger.error('Failed to send access request email:', error);
    throw new Error('Failed to send access request email');
  }
};

/**
 * Send Access Approval Email to Doctor
 */
const sendAccessApprovalEmail = async (doctorEmail, patientProfile, accessRequest) => {
  try {
    const content = `
      <h2>✅ Access Request Approved</h2>
      <p>Good news!</p>
      <p>Your access request has been approved by the patient.</p>
      
      <div class="info-box">
        <h3>Patient Information:</h3>
        <p><strong>Email:</strong> ${patientProfile.User?.email || 'Not available'}</p>
        <p><strong>Patient ID:</strong> ${patientProfile.id}</p>
      </div>

      <div class="info-box">
        <h3>Access Details:</h3>
        <p><strong>Access Type:</strong> ${accessRequest.requestType === 'both' ? 'View & Create Records' : accessRequest.requestType === 'create' ? 'Create Records Only' : 'View Records Only'}</p>
        <p><strong>Granted Duration:</strong> ${calculateDuration(accessRequest.expiresAt)}</p>
        <p><strong>Access Expires:</strong> ${new Date(accessRequest.expiresAt).toLocaleString()}</p>
        <p><strong>Approved On:</strong> ${new Date(accessRequest.respondedAt).toLocaleString()}</p>
      </div>

      <p style="text-align: center;">
        <a href="${process.env.FRONTEND_URL}/records" class="action-button">
          📋 View Patient Records
        </a>
      </p>

      <p>You can now access this patient's medical records from your dashboard.</p>
    `;

    const mailOptions = {
      from: `"Universal Medical Wallet" <${process.env.EMAIL_USER}>`,
      to: doctorEmail,
      subject: '✅ Medical Record Access Approved',
      html: generateEmailTemplate('Access Approved', content)
    };

    const info = await transporter.sendMail(mailOptions);
    
    logger.info('Access approval email sent', { 
      to: doctorEmail,
      messageId: info.messageId,
      patientId: patientProfile.id,
      requestId: accessRequest.id
    });

    return { success: true, messageId: info.messageId };

  } catch (error) {
    logger.error('Failed to send access approval email:', error);
    throw new Error('Failed to send access approval email');
  }
};

/**
 * Send Access Denial Email to Doctor
 */
const sendAccessDenialEmail = async (doctorEmail, patientProfile, accessRequest) => {
  try {
    const content = `
      <h2>❌ Access Request Denied</h2>
      <p>Hello,</p>
      <p>Unfortunately, your access request has been denied by the patient.</p>
      
      <div class="info-box">
        <h3>Patient Information:</h3>
        <p><strong>Email:</strong> ${patientProfile.User?.email || 'Not available'}</p>
        <p><strong>Patient ID:</strong> ${patientProfile.id}</p>
      </div>

      <div class="info-box">
        <h3>Request Details:</h3>
        <p><strong>Access Type Requested:</strong> ${accessRequest.requestType === 'both' ? 'View & Create Records' : accessRequest.requestType === 'create' ? 'Create Records Only' : 'View Records Only'}</p>
        <p><strong>Reason:</strong> ${accessRequest.reason || 'Not provided'}</p>
        <p><strong>Denied On:</strong> ${new Date(accessRequest.respondedAt).toLocaleString()}</p>
      </div>

      <div class="warning">
        <p><strong>ℹ️ Note:</strong></p>
        <p>The patient has chosen not to grant access at this time. You may request access again in the future if needed.</p>
      </div>

      <p style="text-align: center;">
        <a href="${process.env.FRONTEND_URL}/records" class="action-button">
          🏥 Go to Dashboard
        </a>
      </p>
    `;

    const mailOptions = {
      from: `"Universal Medical Wallet" <${process.env.EMAIL_USER}>`,
      to: doctorEmail,
      subject: '❌ Medical Record Access Request Denied',
      html: generateEmailTemplate('Access Denied', content)
    };

    const info = await transporter.sendMail(mailOptions);
    
    logger.info('Access denial email sent', { 
      to: doctorEmail,
      messageId: info.messageId,
      patientId: patientProfile.id,
      requestId: accessRequest.id
    });

    return { success: true, messageId: info.messageId };

  } catch (error) {
    logger.error('Failed to send access denial email:', error);
    throw new Error('Failed to send access denial email');
  }
};

/**
 * Send Password Reset Email (Already exists, keeping for reference)
 */
const sendPasswordResetEmail = async (email, resetUrl) => {
  try {
    const content = `
      <h2>🔐 Password Reset Request</h2>
      <p>Hello,</p>
      <p>We received a request to reset your password for your Universal Medical Wallet account.</p>
      
      <div class="info-box">
        <p>Click the button below to reset your password. This link will expire in <strong>1 hour</strong>.</p>
      </div>

      <p style="text-align: center;">
        <a href="${resetUrl}" class="action-button">
          🔑 Reset Password
        </a>
      </p>

      <div class="warning">
        <p><strong>⚠️ Security Notice:</strong></p>
        <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
      </div>

      <p>For security reasons, this link will expire in 1 hour.</p>
    `;

    const mailOptions = {
      from: `"Universal Medical Wallet" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Password Reset Request',
      html: generateEmailTemplate('Password Reset', content)
    };

    const info = await transporter.sendMail(mailOptions);
    
    logger.info('Password reset email sent', { 
      to: email,
      messageId: info.messageId
    });

    return { success: true, messageId: info.messageId };

  } catch (error) {
    logger.error('Failed to send password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

/**
 * Helper: Calculate human-readable duration
 */
const calculateDuration = (expiresAt) => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry - now;
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffHours / 24);

  if (diffDays >= 1) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  }
  return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
};

/**
 * Send Email Verification OTP
 */
const sendVerificationEmail = async (email, otp) => {
  try {
    const content = `
      <h2>📧 Email Verification</h2>
      <p>Hello,</p>
      <p>Thank you for registering with Universal Medical Wallet!</p>
      <p>Please verify your email address to activate your account.</p>
      
      <div class="info-box" style="text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; padding: 20px; background: #f8f9fa; border-left: 4px solid #667eea;">
        ${otp}
      </div>

      <div class="warning">
        <p><strong>⚠️ Security Notice:</strong></p>
        <p>This OTP is valid for <strong>10 minutes</strong> only.</p>
        <p>If you didn't create an account, please ignore this email.</p>
        <p><strong>Never share this OTP with anyone!</strong></p>
      </div>

      <p>Enter this code on the verification page to activate your account.</p>
    `;

    const mailOptions = {
      from: `"Universal Medical Wallet" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '📧 Verify Your Email - Universal Medical Wallet',
      html: generateEmailTemplate('Email Verification', content)
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info('Verification email sent', {
      to: email,
      messageId: info.messageId
    });

    return { success: true, messageId: info.messageId };

  } catch (error) {
    logger.error('Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

module.exports = {
  sendAccessRequestEmail,
  sendAccessApprovalEmail,
  sendAccessDenialEmail,
  sendPasswordResetEmail,
  sendVerificationEmail 
};