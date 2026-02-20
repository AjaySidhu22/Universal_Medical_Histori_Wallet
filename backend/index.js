// backend/index.js

const express = require('express');
const app = express();
app.set('trust proxy', 1); // ✅ ADDED: Trust Render's reverse proxy
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const https = require('https');  // ✅ ADDED: HTTPS module
const http = require('http');    // ✅ ADDED: HTTP module for redirect
const hpp = require('hpp');
const morgan = require('morgan');
const fs = require('fs');

// Load environment variables FIRST
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Import logger
const logger = require('./src/utils/logger');
const { sequelize, connectDB } = require('./src/config/database');
const errorHandler = require('./src/middlewares/errorMiddleware');

const { generateToken, csrfProtection } = require('./src/middlewares/csrfMiddleware');

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// ==============================================
// SSL CERTIFICATE LOADING
// ==============================================

let sslOptions = null;
const USE_HTTPS = process.env.USE_HTTPS === 'true';

if (USE_HTTPS) {
  try {
    const keyPath = path.join(__dirname, process.env.SSL_KEY_PATH || './ssl/server.key');
    const certPath = path.join(__dirname, process.env.SSL_CERT_PATH || './ssl/server.cert');

    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
      logger.error('❌ SSL certificate files not found!');
      logger.error(`Key path: ${keyPath}`);
      logger.error(`Cert path: ${certPath}`);
      process.exit(1);
    }

    sslOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };

    logger.info('✅ SSL certificates loaded successfully');
  } catch (err) {
    logger.error('❌ Failed to load SSL certificates:', err);
    process.exit(1);
  }
}

// ==============================================
// SECURITY MIDDLEWARE
// ==============================================

const helmet = require('helmet');
const { sanitizeInput, xssClean, mongoSanitize } = require('./src/middlewares/sanitizeMiddleware');
const { apiLimiter } = require('./src/middlewares/security');

// 1. Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {  // ✅ ADDED: HTTP Strict Transport Security
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// 2. CORS: Configure allowed origins
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// 3. HTTP Request Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined', { stream: logger.stream }));
} else {
  app.use(morgan('dev'));
}

// 4. Body Parser: Limit payload size
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Cookie Parser
app.use(cookieParser());

// 6. XSS protection
app.use(xssClean);

// 7. NoSQL injection protection
app.use(mongoSanitize);

// 8. Input sanitization
app.use(sanitizeInput);

// 9. Prevent HTTP Parameter Pollution
app.use(hpp());

// 10. Global rate limiting
app.use('/api/', apiLimiter);

logger.info('✅ Security middleware enabled');

// ==============================================
// CSRF PROTECTION
// ==============================================

 
// Endpoint to get CSRF token
app.get('/api/csrf-token', (req, res) => {
  try {
    const csrfToken = generateToken(req, res, true); // true = overwrite existing token
    res.json({ csrfToken });
  } catch (error) {
    logger.error('Failed to generate CSRF token:', error);
    res.status(500).json({ error: 'Failed to generate CSRF token' });
  }
});

// ==============================================
// CSRF PROTECTION (Header-Only - Modern & Secure)
// ==============================================

// Apply CSRF protection to state-changing requests
app.use('/api', (req, res, next) => {
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for login and register (they need to work without token initially)
  if (req.path === '/auth/login' || req.path === '/auth/register') {
    return next();
  }

  // Apply CSRF protection to all other POST/PUT/DELETE requests
  csrfProtection(req, res, next);
});

logger.info('✅ CSRF protection enabled (Header-Only)');

 

// ==============================================
// STATIC FILE SERVING (Development only)
// ==============================================
if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  logger.info('📁 Static file serving enabled for /uploads');
}

// ==============================================
// ROUTES
// ==============================================

logger.info('🔄 Loading routes...');

try {
  const authRoutes = require('./src/routes/authRoutes');
  logger.info('✅ Auth routes loaded');
  
  const profileRoutes = require('./src/routes/profileRoutes');
  logger.info('✅ Profile routes loaded');
  
  const medicalRecordRoutes = require('./src/routes/medicalRecordRoutes');
  logger.info('✅ Medical record routes loaded');
  
  const adminRoutes = require('./src/routes/adminRoutes');
  logger.info('✅ Admin routes loaded');
  
  const shareRoutes = require('./src/routes/shareRoutes');
  logger.info('✅ Share routes loaded');
  
  const accessRequestRoutes = require('./src/routes/accessRequestRoutes');
  logger.info('✅ Access request routes loaded');
   
  const qrRoutes = require('./src/routes/qrRoutes');

  app.use('/api/auth', authRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/medical', medicalRecordRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/share', shareRoutes);
  app.use('/api/access-requests', accessRequestRoutes);
  app.use('/api/qr', qrRoutes);
  
  logger.info('✅ All routes registered');
} catch (err) {
  logger.error('❌ Failed to load routes:', err);
  logger.error('Stack trace:', err.stack);
  process.exit(1);
}

// ==============================================
// HEALTH CHECK & STATUS
// ==============================================

app.get('/api/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      environment: process.env.NODE_ENV || 'development',
      https: USE_HTTPS  // ✅ ADDED: Show HTTPS status
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

app.get('/api/status', (req, res) => {
  res.json({
    service: 'Universal Medical Wallet API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    https: USE_HTTPS  // ✅ ADDED: Show HTTPS status
  });
});

// ==============================================
// ERROR HANDLING
// ==============================================

// 404 handler
app.use((req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use(errorHandler);

// ==============================================
// START SERVER (HTTP or HTTPS)
// ==============================================

const PORT = process.env.PORT || 5000;
const HTTP_PORT = 5001;  // ✅ ADDED: HTTP redirect port

logger.info('🔄 Starting server initialization...');

// Start server
const startServer = async () => {
  try {
    logger.info('🔄 Step 1: Calling connectDB()...');
    
    await connectDB();
    
    logger.info('✅ Step 2: Database connected successfully');
    logger.info('✅ Security middleware enabled');
     
    
    if (USE_HTTPS) {
      // ✅ HTTPS SERVER
      logger.info('🔄 Step 3: Starting HTTPS server...');
      
      const httpsServer = https.createServer(sslOptions, app);
      
      httpsServer.listen(PORT, () => {
        logger.info(`🔒 HTTPS Server running on port ${PORT}`);
        logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'https://localhost:3000'}`);
        logger.info(`✅ SSL/TLS encryption enabled`);
      });

      // ✅ HTTP to HTTPS REDIRECT (Optional)
      if (process.env.NODE_ENV !== 'production') {
        const httpApp = express();
        httpApp.use('*', (req, res) => {
          const httpsUrl = `https://${req.hostname}:${PORT}${req.url}`;
          logger.info(`↪️  Redirecting HTTP to HTTPS: ${httpsUrl}`);
          res.redirect(301, httpsUrl);
        });

        http.createServer(httpApp).listen(HTTP_PORT, () => {
          logger.info(`↪️  HTTP redirect server running on port ${HTTP_PORT}`);
          logger.info(`   All HTTP traffic will be redirected to HTTPS`);
        });
      }
      
    } else {
      // ✅ HTTP SERVER (Fallback)
      logger.info('🔄 Step 3: Starting HTTP server...');
      logger.warn('⚠️  HTTPS is disabled - using HTTP (not recommended for production)');
      
      app.listen(PORT, () => {
        logger.info(`🚀 HTTP Server running on port ${PORT}`);
        logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      });
    }
    
  } catch (err) {
    logger.error('❌ Failed to start server:', err);
    logger.error('Error details:', err.stack);
    process.exit(1);
  }
};

// Call the start function
logger.info('🔄 Calling startServer()...');
startServer().catch(err => {
  logger.error('❌ StartServer failed:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

module.exports = app;