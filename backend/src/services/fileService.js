// backend/src/services/fileService.js

const { S3Client, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET;
const IS_PRODUCTION = process.env.NODE_ENV === 'production' && BUCKET_NAME;

/**
 * Generate signed URL for file download (production only)
 */
  const generateSignedUrl = async (fileKey, expiresIn = 3600) => {      
  if (!IS_PRODUCTION) {
    // In development or render deployment, use SERVER_URL
    const serverUrl = process.env.SERVER_URL || 'https://localhost:5000';
    return `${serverUrl}/uploads/medical-records/${fileKey}`;
  }
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    
    logger.info('Generated signed URL', { fileKey, expiresIn });
    return signedUrl;

  } catch (err) {
    logger.error('Failed to generate signed URL:', err);
    throw new Error('Failed to generate file access URL');
  }
};

/**
 * Delete file from S3 or local storage
 */
const deleteFile = async (fileKey) => {
  if (IS_PRODUCTION) {
    // Delete from S3
    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey
      });

      await s3Client.send(command);
      logger.info('File deleted from S3', { fileKey });

    } catch (err) {
      logger.error('Failed to delete file from S3:', err);
      throw new Error('Failed to delete file');
    }

  } else {
    // Delete from local storage
    try {
      const filePath = path.join(__dirname, '../../uploads/medical-records', fileKey);
      await fs.unlink(filePath);
      logger.info('File deleted from local storage', { fileKey });

    } catch (err) {
      logger.error('Failed to delete file from local storage:', err);
      // Don't throw error if file doesn't exist
      if (err.code !== 'ENOENT') {
        throw new Error('Failed to delete file');
      }
    }
  }
};

/**
 * Get file metadata
 */
const getFileMetadata = (file) => {
  return {
    filename: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
    key: IS_PRODUCTION ? file.key : file.filename,
    location: IS_PRODUCTION ? file.location : `/uploads/medical-records/${file.filename}`
  };
};

module.exports = {
  generateSignedUrl,
  deleteFile,
  getFileMetadata,
  IS_PRODUCTION
};