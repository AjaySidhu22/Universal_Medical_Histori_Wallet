// backend/test-connection.js

const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log('=== DATABASE CONNECTION TEST ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL (first 50 chars):', process.env.DATABASE_URL?.substring(0, 50));

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log
});

console.log('\n=== Attempting connection... ===');

sequelize.authenticate()
  .then(() => {
    console.log('✅ SUCCESS: Database connected!');
    return sequelize.sync();
  })
  .then(() => {
    console.log('✅ SUCCESS: Models synchronized!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ ERROR:', err);
    process.exit(1);
  });

// Timeout after 10 seconds
setTimeout(() => {
  console.error('❌ TIMEOUT: Connection took too long');
  process.exit(1);
}, 10000);