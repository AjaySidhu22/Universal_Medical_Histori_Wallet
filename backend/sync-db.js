// backend/sync-db.js
const { sequelize } = require('./src/models');

async function syncDatabase() {
  try {
    console.log('🔄 Connecting to PostgreSQL...');
    await sequelize.authenticate();
    console.log('✅ Connected!');
    
    console.log('🔄 Creating tables...');
    await sequelize.sync({ force: true });
    
    console.log('✅ All tables created successfully!');
    console.log('📋 Tables:', Object.keys(sequelize.models).join(', '));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

syncDatabase();