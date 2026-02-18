 // backend/src/middlewares/updateMiddleware.js

const multer = require('multer');
const path = require('path');
const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');
const logger = require('../utils/logger');

// Configure AWS S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Allowed file types for medical records
const ALLOWED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'application/dicom': ['.dcm'], // Medical imaging format
  'image/tiff': ['.tif', '.tiff'] // Medical imaging
};

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// File filter function
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();

  // Check if file type is allowed
  if (ALLOWED_FILE_TYPES[mimeType] && ALLOWED_FILE_TYPES[mimeType].includes(ext)) {
    logger.info('File upload accepted', { 
      filename: file.originalname, 
      mimetype: mimeType,
      userId: req.user?.id 
    });
    cb(null, true);
  } else {
    logger.warn('File upload rejected - invalid type', { 
      filename: file.originalname, 
      mimetype: mimeType,
      userId: req.user?.id 
    });
    cb(new Error(`Invalid file type. Allowed types: JPEG, PNG, WEBP, PDF, DICOM, TIFF`), false);
  }
};

// Generate unique filename
const generateFileName = (file) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const ext = path.extname(file.originalname);
  return `medical-records/${timestamp}-${randomString}${ext}`;
};

// Storage configuration
let upload;

if (process.env.NODE_ENV === 'production' && process.env.AWS_S3_BUCKET) {
  // Production: Use AWS S3
  upload = multer({
    storage: multerS3({
      s3: s3Client,
      bucket: process.env.AWS_S3_BUCKET,
      acl: 'private', // Files are private by default
      metadata: (req, file, cb) => {
        cb(null, {
          uploadedBy: req.user.id,
          uploadedAt: new Date().toISOString(),
          originalName: file.originalname
        });
      },
      key: (req, file, cb) => {
        cb(null, generateFileName(file));
      }
    }),
    fileFilter: fileFilter,
    limits: {
      fileSize: MAX_FILE_SIZE,
      files: 5 // Maximum 5 files per request
    }
  });

  logger.info('File upload configured for AWS S3');

} else {
  // Development: Use local disk storage
  const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, '../../uploads/medical-records');
      
      // Create directory if it doesn't exist
      const fs = require('fs');
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      cb(null, generateFileName(file).replace('medical-records/', ''));
    }
  });

  upload = multer({
    storage: localStorage,
    fileFilter: fileFilter,
    limits: {
      fileSize: MAX_FILE_SIZE,
      files: 5
    }
  });

  logger.warn('⚠️ File upload configured for LOCAL STORAGE (development mode)');
}

// Middleware to handle upload errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 5 files per upload'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  }

  if (err) {
    logger.error('File upload error:', err);
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload failed'
    });
  }

  next();
};

// Export upload middleware
module.exports = {
  uploadSingle: upload.single('file'),
  uploadMultiple: upload.array('files', 5),
  handleUploadError,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE
};