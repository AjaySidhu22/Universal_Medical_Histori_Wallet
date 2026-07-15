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
      // Generate signed URL for raw files (PDFs, DCM)
      const timestamp = Math.floor(Date.now() / 1000) + 3600;
      const signedUrl = cloudinary.url(fileKey, {
        secure: true,
        resource_type: 'raw',
        sign_url: true,
        expires_at: timestamp
      });
      return signedUrl;
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
  console.log('CLOUDINARY FILE OBJECT:', JSON.stringify(file, null, 2)); 
  // Determine resource type — PDFs upload as 'raw', images as 'image'
  const resourceType = file.resource_type || 
    (file.mimetype === 'application/pdf' ? 'raw' : 'image');

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