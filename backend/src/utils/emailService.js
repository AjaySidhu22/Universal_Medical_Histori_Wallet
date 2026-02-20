// backend/src/utils/emailService.js
const logger = require('./logger');

// 🔥 THE BREVO HTTP TRANSPORTER (Bypasses Render's Firewall) 🔥
const transporter = {
  sendMail: async (mailOptions) => {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: "Universal Medical Wallet", email: process.env.EMAIL_USER },
        to: [{ email: mailOptions.to }],
        subject: mailOptions.subject,
        htmlContent: mailOptions.html
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      logger.error('Brevo API Error:', errorData);
      throw new Error('Failed to send email via Brevo API');
    }

    const data = await response.json();
    return { messageId: data.messageId };
  }
};

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
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px 20px; }
    .action-button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
    .info-box { background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
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
      to: email,
      subject: '📧 Verify Your Email - Universal Medical Wallet',
      html: generateEmailTemplate('Email Verification', content)
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info('Verification email sent successfully via Brevo', { to: email });
    return { success: true, messageId: info.messageId };

  } catch (error) {
    logger.error('Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
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
  if (diffDays >= 1) return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
};

// ==========================================
// OTHER EMAIL FUNCTIONS (Restored)
// ==========================================

const sendAccessRequestEmail = async (patientEmail, doctorProfile, accessRequest) => {
  try {
    const content = `<h2>📋 New Access Request</h2><p>A doctor has requested access to your medical records.</p>`;
    const mailOptions = { to: patientEmail, subject: '🏥 New Medical Record Access Request', html: generateEmailTemplate('New Access Request', content) };
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) { throw new Error('Failed to send access request email'); }
};

const sendAccessApprovalEmail = async (doctorEmail, patientProfile, accessRequest) => {
  try {
    const content = `<h2>✅ Access Request Approved</h2><p>Your access request has been approved by the patient.</p>`;
    const mailOptions = { to: doctorEmail, subject: '✅ Medical Record Access Approved', html: generateEmailTemplate('Access Approved', content) };
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) { throw new Error('Failed to send access approval email'); }
};

const sendAccessDenialEmail = async (doctorEmail, patientProfile, accessRequest) => {
  try {
    const content = `<h2>❌ Access Request Denied</h2><p>Unfortunately, your access request has been denied by the patient.</p>`;
    const mailOptions = { to: doctorEmail, subject: '❌ Medical Record Access Request Denied', html: generateEmailTemplate('Access Denied', content) };
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) { throw new Error('Failed to send access denial email'); }
};

const sendPasswordResetEmail = async (email, resetUrl) => {
  try {
    const content = `<h2>🔑 Password Reset Request</h2><p>Click the link to reset your password: <a href="${resetUrl}">Reset Password</a></p>`;
    const mailOptions = { to: email, subject: '🔑 Password Reset Request', html: generateEmailTemplate('Password Reset', content) };
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) { throw new Error('Failed to send password reset email'); }
};

module.exports = {
  sendAccessRequestEmail,
  sendAccessApprovalEmail,
  sendAccessDenialEmail,
  sendPasswordResetEmail,
  sendVerificationEmail
};