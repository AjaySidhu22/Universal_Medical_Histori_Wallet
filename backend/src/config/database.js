// backend/src/config/database.js
 
const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

let sequelize;
let connectionType;

// Determine environment
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

if (isTest) {
  // TEST: Use SQLite in memory
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
  });
  connectionType = 'Test (SQLite in-memory)';
  
} else if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
  // PRODUCTION/STAGING: Use PostgreSQL
  const isLocal = process.env.DATABASE_URL.includes('localhost') ||
                  process.env.DATABASE_URL.includes('127.0.0.1');

  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: isProduction ? false : false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false  // ✅ Accept self-signed certificates
      }
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
  
  connectionType = isLocal ? 'Local PostgreSQL (SSL)' : 'Remote PostgreSQL (SSL)';
  
} else {
  // DEVELOPMENT FALLBACK: Use SQLite
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.resolve(__dirname, '../../database.sqlite'),
    logging: false
  });
  connectionType = 'Development (SQLite)';
}

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    
    // Import logger only after it's initialized
    const logger = require('../utils/logger');
    logger.info(`Database connected: ${connectionType}`);
    
    // Sync models in development only (never in production)
    if (!isProduction) {
      await sequelize.sync({ alter: false });
      logger.info('Database models synchronized');
    }
    
    return true;
  } catch (error) {
    // Try to use logger, fallback to console if not available
    try {
      const logger = require('../utils/logger');
      logger.error('Database connection failed:', error.message);
    } catch {
      console.error('Database connection failed:', error.message);
    }
    throw error;
  }
};

module.exports = { sequelize, connectDB };