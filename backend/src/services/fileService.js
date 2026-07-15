// backend/src/services/fileService.js

const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Generate URL for file access
 * resourceType must be passed from DB — 'image' or 'raw'
 */
const generateSignedUrl = async (fileKey, resourceType = 'image') => {
  try {
    if (resourceType === 'raw') {
      const url = cloudinary.url(fileKey, {
        secure: true,
        resource_type: 'raw',
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + 3600
      });
      return url;
    }

    const url = cloudinary.url(fileKey, {
      secure: true,
      resource_type: resourceType
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
const deleteFile = async (fileKey, resourceType = 'image') => {
  try {
    await cloudinary.uploader.destroy(fileKey, { resource_type: resourceType });
    logger.info('File deleted from Cloudinary', { fileKey });
  } catch (err) {
    logger.error('Failed to delete file from Cloudinary:', err);
  }
};

/**
 * Get file metadata from multer-cloudinary upload
 * multer-storage-cloudinary puts resource_type in file.resource_type
 */
const getFileMetadata = (file) => {
  console.log('FILE MIMETYPE:', file.mimetype, 'ORIGINALNAME:', file.originalname);
  // Determine from mimetype since multer-storage-cloudinary doesn't return resource_type
  const rawTypes = ['application/pdf', 'application/dicom'];
  const resourceType = rawTypes.includes(file.mimetype) ? 'raw' : 'image';

  return {
    filename: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
    key: file.filename,
    location: file.path,
    resourceType
  };
};

module.exports = {
  generateSignedUrl,
  deleteFile,
  getFileMetadata
};