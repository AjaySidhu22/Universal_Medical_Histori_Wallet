// backend/src/config/index.js

// ✅ REQUIRED for all environments
const requiredEnvVars = [
  'JWT_SECRET',
];

// ✅ Check required variables
requiredEnvVars.forEach((name) => {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
});

// ✅ OPTIONAL for development (warn if missing in production)
const optionalEnvVars = [
  'DATABASE_URL',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'AWS_BUCKET_NAME',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASS',
];

// Warn about missing optional variables only in production
if (process.env.NODE_ENV === 'production') {
  optionalEnvVars.forEach((name) => {
    if (!process.env[name]) {
      console.warn(`⚠️  WARNING: Missing environment variable: ${name}`);
    }
  });
}

module.exports = {
  jwtSecret: process.env.JWT_SECRET,
  databaseUrl: process.env.DATABASE_URL || null, // ✅ Allow null for SQLite fallback
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || null,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || null,
    region: process.env.AWS_REGION || 'us-east-1',
    bucket: process.env.AWS_BUCKET_NAME || null,
  },
  email: {
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: process.env.EMAIL_PORT || 587,
    user: process.env.EMAIL_USER || null,
    pass: process.env.EMAIL_PASS || null,
  },
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};