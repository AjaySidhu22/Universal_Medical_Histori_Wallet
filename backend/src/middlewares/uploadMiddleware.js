// // \backend\src\middlewares\uploadMiddleware.js

// const multer = require('multer');
// const path = require('path');
// const crypto = require('crypto');

// // 1. Define storage settings
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         // Destination is the 'uploads' folder relative to the backend root (where index.js is)
//         cb(null, 'uploads/'); 
//     },
//     filename: (req, file, cb) => {
//         // Create a unique filename: <random_string>-<timestamp>.<ext>
//         const uniqueSuffix = crypto.randomBytes(16).toString('hex');
//         const fileExtension = path.extname(file.originalname);
//         cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
//     }
// });

// // 2. Define file filter (Optional, but recommended for security/control)
// const fileFilter = (req, file, cb) => {
//     // Accept common image/document file types
//     if (
//         file.mimetype === 'image/jpeg' || 
//         file.mimetype === 'image/png' || 
//         file.mimetype === 'application/pdf' ||
//         file.mimetype === 'application/msword' || // for .doc
//         file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // for .docx
//     ) {
//         cb(null, true); // Accept file
//     } else {
//         // Reject file and pass an error
//         cb(new Error('Invalid file type. Only JPEG, PNG, DOC, DOCX, and PDF files are allowed.'), false);
//     }
// };


// // 3. Initialize multer upload instance
// const upload = multer({ 
//     storage: storage,
//     limits: {
//         fileSize: 1024 * 1024 * 5 // Max 5MB file size limit
//     },
//     fileFilter: fileFilter
// });

// // We export the configured upload object
// module.exports = upload;

const multer = require('multer');
const path = require('path');
const crypto = require('crypto'); // Built-in Node.js module for randomness/hashing

// 1. Import Cloud Storage Libraries
const aws = require('aws-sdk'); // AWS SDK
const multerS3 = require('multer-s3'); // Multer connector for S3
// No longer using uuid package due to ERR_REQUIRE_ESM. Using crypto instead.

// Configure AWS credentials (loaded from .env)
// CRITICAL: Ensure dotenv is loaded if this file runs before global load
// If not, we rely on index.js loading it first.
aws.config.update({
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    region: process.env.AWS_S3_REGION
});

const s3 = new aws.S3();

// --- 1. Define S3 Storage Settings (Replacing diskStorage) ---
const storage = multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    acl: 'private', 
    metadata: function (req, file, cb) {
        // Ensure req.user exists from the preceding protect middleware
        cb(null, { fieldName: file.fieldname, userId: req.user.id });
    },
    key: function (req, file, cb) {
        // Fix: Revert to using crypto for unique ID to avoid ES Module error
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        const fileExtension = path.extname(file.originalname);
        
        // Key format: medical-files/user_id/hex_string.ext
        const folder = req.user.id; 
        const uniqueFileName = `${uniqueSuffix}${fileExtension}`;
        
        cb(null, `medical-files/${folder}/${uniqueFileName}`);
    }
});

// --- 2. Define file filter (Remains the same for security) ---
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'image/jpeg', 'image/png', 'application/pdf', 
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true); 
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, DOC, DOCX, and PDF files are allowed.'), false);
    }
};

// --- 3. Initialize multer upload instance ---
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5 // Max 5MB file size limit
    },
    fileFilter: fileFilter
});

module.exports = upload;
 