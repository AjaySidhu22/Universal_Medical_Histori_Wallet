// backend/src/services/fileService.js

const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Return the stored Cloudinary URL directly
 * fileKey here is the full URL stored at upload time
 */
const generateSignedUrl = async (fileKey, resourceType = 'image') => {
  try {
    // If fileKey is already a full URL, return it directly
    if (fileKey && fileKey.startsWith('http')) {
      return fileKey;
    }

    // Otherwise build URL
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
    // Extract public_id from URL if full URL passed
    let publicId = fileKey;
    if (fileKey && fileKey.startsWith('http')) {
      const parts = fileKey.split('/upload/');
      if (parts[1]) {
        publicId = parts[1].replace(/^v\d+\//, '');
        // Remove extension for non-raw files
        if (resourceType !== 'raw') {
          publicId = publicId.replace(/\.[^/.]+$/, '');
        }
      }
    }
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    logger.info('File deleted from Cloudinary', { publicId });
  } catch (err) {
    logger.error('Failed to delete file from Cloudinary:', err);
  }
};

/**
 * Get file metadata from multer-cloudinary upload
 * Save file.path (full Cloudinary URL) as the fileKey
 */
const getFileMetadata = (file) => {
  console.log('FILE MIMETYPE:', file.mimetype, 'PATH:', file.path);
  const rawTypes = ['application/pdf', 'application/dicom'];
  const resourceType = rawTypes.includes(file.mimetype) ? 'raw' : 'image';
  console.log('RESOURCE TYPE:', resourceType);

  return {
    filename: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
    key: file.path,  // Store full Cloudinary URL as key
    location: file.path,
    resourceType
  };
};

module.exports = {
  generateSignedUrl,
  deleteFile,
  getFileMetadata
};