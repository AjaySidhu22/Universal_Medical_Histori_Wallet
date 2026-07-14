// backend/src/services/fileService.js

const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Generate URL for file access
 * Cloudinary URLs are permanent — no signing needed
 */
const generateSignedUrl = async (fileKey) => {
  try {
    // fileKey is the Cloudinary public_id
    const url = cloudinary.url(fileKey, {
      secure: true,
      resource_type: 'auto'
    });
    return url;
  } catch (err) {
    logger.error('Failed to generate Cloudinary URL:', err);
    throw new Error('Failed to generate file access URL');
  }
};

/**
 * Delete file from Cloudinary
 */
const deleteFile = async (fileKey) => {
  try {
    await cloudinary.uploader.destroy(fileKey, { resource_type: 'raw' });
    logger.info('File deleted from Cloudinary', { fileKey });
  } catch (err) {
    // Try image resource type if raw fails
    try {
      await cloudinary.uploader.destroy(fileKey, { resource_type: 'image' });
      logger.info('File deleted from Cloudinary as image', { fileKey });
    } catch (err2) {
      logger.error('Failed to delete file from Cloudinary:', err2);
    }
  }
};

/**
 * Get file metadata from multer-cloudinary upload
 */
const getFileMetadata = (file) => {
  return {
    filename: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
    key: file.filename, // Cloudinary public_id stored in file.filename by multer-storage-cloudinary
    location: file.path  // Cloudinary secure URL
  };
};

module.exports = {
  generateSignedUrl,
  deleteFile,
  getFileMetadata
};