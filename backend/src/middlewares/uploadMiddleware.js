// backend/src/middlewares/updateMiddleware.js

const multer = require('multer');
const path = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Allowed file types
const ALLOWED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'application/dicom': ['.dcm'],
  'image/tiff': ['.tif', '.tiff']
};

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// File filter
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();

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
    cb(new Error('Invalid file type. Allowed types: JPEG, PNG, WEBP, PDF, DICOM, TIFF'), false);
  }
};

// Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const publicId = `medical-records/${timestamp}-${randomString}`;

    return {
      folder: 'medical-records',
      public_id: `${timestamp}-${randomString}`,
      resource_type: 'auto',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'dcm', 'tif', 'tiff']
    };
  }
});

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5
  }
});

logger.info('File upload configured for Cloudinary');

// Error handler
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
        message: 'Too many files. Maximum 5 files per request'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  next();
};

const uploadSingle = upload.single('file');

module.exports = {
  uploadSingle,
  handleUploadError
};