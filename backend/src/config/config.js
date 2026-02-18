// backend/src/config/config.js

require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'invincibleajaykuldeepsidhu2003',
    database: process.env.DB_NAME || 'universal_medical_wallet',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log,
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: false,
  },
};