// const express = require('express');
// const cors = require('cors');
// const cookieParser = require('cookie-parser');
// const dotenv = require('dotenv');
// const { connectDB, sequelize } = require('./src/config/database');
// // We now import the models from the central index file
// const { User, PatientProfile, DoctorProfile, MedicalRecord, ShareToken } = require('./src/models'); // **UPDATED LINE**

// dotenv.config();

// const authRoutes = require('./src/routes/authRoutes');
// const profileRoutes = require('./src/routes/profileRoutes');
// const adminRoutes = require('./src/routes/adminRoutes');
// const errorHandler = require('./src/middlewares/errorMiddleware');
// // **NEW IMPORT**
// const shareRoutes = require('./src/routes/shareRoutes'); 
 
// const app = express();


// const PORT = process.env.PORT || 5000;

// app.use(cors({
//   origin: 'http://localhost:3000',
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   credentials: true
// }));

// app.use(cookieParser());
// app.use(express.json());

// app.use('/uploads', express.static('uploads')); 

// const medicalRecordRoutes = require('./src/routes/medicalRecordRoutes');
// app.use('/api/medical/records', medicalRecordRoutes);
// // Main route handlers
// app.use('/api/auth', authRoutes);
// app.use('/api/profile', profileRoutes);
// app.use('/api/admin', adminRoutes);
// // **NEW MOUNT**
// app.use('/api/share', shareRoutes); 
// // Test and error handling routes
// app.get('/api/test-error', (req, res, next) => {
//   const err = new Error('This is a test error from server');
//   err.statusCode = 501;
//   next(err);
// });

// app.use((req, res, next) => {
//   const err = new Error('Not Found');
//   err.statusCode = 404;
//   next(err);
// });

// app.use(errorHandler);

// // Database connection and server start
// connectDB()
//   .then(() => {
//     sequelize.sync().then(() => {
//       console.log('Database synchronized.');
//       app.listen(PORT, () => {
//         console.log(`Server is running on port ${PORT}`);
//       });
//     });
//   })
//   .catch(err => {
//     console.error('Failed to start application', err);
//   });



const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables immediately (e.g., for database config)
dotenv.config({ path: path.resolve(__dirname, '.env') }); 

const { connectDB, sequelize } = require('./src/config/database');
const { User, PatientProfile, DoctorProfile, MedicalRecord, ShareToken } = require('./src/models');

const authRoutes = require('./src/routes/authRoutes');
const profileRoutes = require('./src/routes/profileRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const medicalRecordRoutes = require('./src/routes/medicalRecordRoutes');
const shareRoutes = require('./src/routes/shareRoutes');
const errorHandler = require('./src/middlewares/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'; // Get dynamic URL

// --- Global Middleware Setup ---

// Improvement: Use FRONTEND_URL environment variable for CORS
app.use(cors({
    origin: FRONTEND_URL, // Use the configured frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(cookieParser());
app.use(express.json()); // Body parser for JSON payloads

// CRITICAL SECURITY FIX: REMOVE LOCAL STATIC FILE SERVING
// app.use('/uploads', express.static('uploads')); 
// Files are now served via secure S3 Pre-Signed URLs.


// --- Route Handlers ---
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/medical/records', medicalRecordRoutes);
app.use('/api/share', shareRoutes);


// --- Error Handling and Fallback Routes ---
// Test error endpoint (for debugging)
app.get('/api/test-error', (req, res, next) => {
    const err = new Error('This is a test error from server');
    err.statusCode = 501;
    next(err);
});

// 404 Not Found Middleware
app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.statusCode = 404;
    next(err);
});

// Centralized Error Handler
app.use(errorHandler);


// --- Database Connection and Server Start ---
connectDB()
    .then(() => {
        // Warning: sequelize.sync() is used for dev. Use Migrations in production.
        sequelize.sync().then(() => {
            console.log('Database synchronized.');
            app.listen(PORT, () => {
                console.log(`Server is running on port ${PORT}`);
            });
        });
    })
    .catch(err => {
        console.error('Failed to start application:', err);
        // Exit process if DB connection is critical and failed
        process.exit(1); 
    });