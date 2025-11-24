// const { Sequelize } = require('sequelize');
// const path = require('path');

// // Using SQLite for local development (file-based DB)
// const sequelize = new Sequelize({
//   dialect: 'sqlite',
//   storage: path.resolve(__dirname, '../../database.sqlite'),
//   logging: false
// });

// const connectDB = async () => {
//   try {
//     await sequelize.authenticate();
//     console.log('Database connected successfully (SQLite).');
//   } catch (err) {
//     console.error('Unable to connect to DB:', err);
//     throw err;
//   }
// };

// module.exports = { sequelize, connectDB };
const { Sequelize } = require('sequelize');
const path = require('path');
// Import dotenv config to ensure process.env variables are loaded
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') }); 

// Determine which database config to use based on environment variables
let sequelize;
let connectionMessage;

if (process.env.DATABASE_URL) {
    // 1. Production/Staging: Use PostgreSQL via DATABASE_URL
    // The DATABASE_URL format is typically: postgres://user:pass@host:port/dbname
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        logging: false,
        // Recommended for production deployment where SSL is often required
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false // Use with caution, but necessary for some hosted services
            }
        }
    });
    connectionMessage = 'Database connected successfully (PostgreSQL via URL).';
} else {
    // 2. Local Development: Use SQLite (File-based)
    sequelize =  new Sequelize({
        dialect: 'sqlite',
        // Note: Using __dirname for robust path resolution.
        storage: path.resolve(__dirname, '../../database.sqlite'),
        logging: process.env.NODE_ENV === 'development' // Only log SQL in dev if needed
    });
    connectionMessage = 'Database connected successfully (SQLite for local dev).';
}

/**
 * Attempts to authenticate the connection with the configured database.
 * @async
 */
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log(connectionMessage);
    } catch (err) {
        // Log the full error and terminate the process if DB connection is vital
        console.error('CRITICAL: Unable to connect to database:', err);
        throw new Error('Database connection failed.');
    }
};

module.exports = { 
    sequelize, 
    connectDB 
};