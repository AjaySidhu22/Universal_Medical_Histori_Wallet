// const nodemailer = require('nodemailer');
// require('dotenv').config();

// const transporter = nodemailer.createTransport({
//   service: process.env.EMAIL_SERVICE || 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });

// async function sendResetEmail(to, token) {
//   const resetUrl = `http://localhost:3000/reset-password?token=${token}`;

//   const mailOptions = {
//     from: `"Universal Medical Wallet" <${process.env.EMAIL_USER}>`,
//     to,
//     subject: 'Password Reset Request',
//     html: `
//       <h3>Password Reset</h3>
//       <p>You requested to reset your password.</p>
//       <p>Click the link below to reset it:</p>
//       <a href="${resetUrl}">${resetUrl}</a>
//       <p>This link will expire in 1 hour.</p>
//     `
//   };

//   await transporter.sendMail(mailOptions);
//   console.log(`📧 Reset email sent to ${to}`);
// }

// module.exports = { sendResetEmail };



const nodemailer = require('nodemailer');
const path = require('path');
// Import dotenv config here to ensure process.env variables are available
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') }); 

/**
 * Configure the nodemailer transporter using environment variables.
 * Uses SMTP settings defined in .env (e.g., Gmail App Password).
 */
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Sends a password reset email to the specified user.
 * @param {string} to - Recipient email address.
 * @param {string} token - The raw, unhashed reset token to include in the link.
 * @async
 */
async function sendResetEmail(to, token) {
    // Improvement: Use dynamic URL from .env for production readiness
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    
    // Check if essential email credentials are set
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('WARNING: Email credentials not configured. Skipping email send.');
        return; 
    }

    const mailOptions = {
        from: `"Universal Medical Wallet" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Universal Medical Wallet: Password Reset Request',
        html: `
            <html>
            <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
                <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; max-width: 600px; margin: auto;">
                    <h3 style="color: #007bff;">Password Reset Requested</h3>
                    <p>You recently requested to reset the password for your Universal Medical Wallet account.</p>
                    <p>Click the secure link below to proceed with the password reset:</p>
                    <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; margin: 15px 0; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">
                        Reset Password
                    </a>
                    <p>If you did not request a password reset, please ignore this email.</p>
                    <p style="color: #dc3545; font-size: 0.9em;">This link is confidential and will expire in 1 hour for security purposes.</p>
                </div>
            </body>
            </html>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Reset email sent to ${to}`);
    } catch (error) {
        console.error(`❌ Error sending reset email to ${to}:`, error);
        throw new Error('Failed to send reset email via nodemailer.');
    }
}

module.exports = { sendResetEmail };