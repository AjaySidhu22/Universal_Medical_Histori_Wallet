// backend/src/controllers/medicalRecordController.js

const { createMedicalRecordService, getAllRecordsForUser, getMedicalRecordById } = require('../services/medicalRecordService');
const { generateSignedUrl, deleteFile, getFileMetadata } = require('../services/fileService');
const logger = require('../utils/logger');

/**
 * @route   POST /api/medical
 * @desc    Create a new medical record (with optional file upload)
 * @access  Private (Patient or Verified Doctor)
 */
const createMedicalRecord = async (req, res, next) => {
  try {
    const { title, description, diagnosis, prescription, notes, recordDate, patientId } = req.body;

    // File handling
    let fileData = null;
    if (req.file) {
      const metadata = getFileMetadata(req.file);
      fileData = {
        fileKey: metadata.key,
        fileType: req.file.mimetype,
        fileName: req.file.originalname,
        fileSize: req.file.size
      };
      
      logger.info('File uploaded with medical record', { 
        fileKey: metadata.key,
        userId: req.user.id 
      });
    }

    const recordData = {
      title,
      description,
      diagnosis,
      prescription,
      notes,
      recordDate,
      patientId,
      ...fileData
    };

    const record = await createMedicalRecordService(req.user, recordData);

    logger.info('Medical record created', { 
      userId: req.user.id, 
      recordId: record.id,
      hasFile: !!req.file
    });

    res.status(201).json(record);

  } catch (err) {
    // Clean up uploaded file if record creation fails
    if (req.file) {
      try {
        const metadata = getFileMetadata(req.file);
        await deleteFile(metadata.key);
        logger.info('Cleaned up file after failed record creation', { fileKey: metadata.key });
      } catch (cleanupErr) {
        logger.error('Failed to cleanup file:', cleanupErr);
      }
    }

    logger.error('Create medical record failed:', err);
    next(err);
  }
};

/**
 * @route   GET /api/medical
 * @desc    Get all medical records for authenticated user
 * @access  Private
 */
const getMyMedicalRecords = async (req, res, next) => {
  try {
    // Get pagination params from query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    // Get all records first (we'll paginate after URL generation)
    const allRecords = await getAllRecordsForUser(req.user);

    // Get total count
    const totalCount = allRecords.length;
    const totalPages = Math.ceil(totalCount / limit);

    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    // Get records for current page
    const paginatedRecords = allRecords.slice(startIndex, endIndex);

    // Generate signed URLs for files (only for current page)
    const recordsWithUrls = await Promise.all(
      paginatedRecords.map(async (record) => {
        const recordJson = record.toJSON();

        if (recordJson.fileKey) {
          try {
            recordJson.fileUrl = await generateSignedUrl(recordJson.fileKey);
          } catch (err) {
            logger.error('Failed to generate signed URL:', err);
            recordJson.fileUrl = null;
          }
        }

        return recordJson;
      })
    );

    res.json({
      data: recordsWithUrls,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit
      }
    });

  } catch (err) {
    logger.error('Get medical records failed:', err);
    next(err);
  }
}; 

/**
 * @route   GET /api/medical/:id
 * @desc    Get single medical record by ID
 * @access  Private
 */
const getMedicalRecord = async (req, res, next) => {
  try {
    const record = await getMedicalRecordById(req.user, req.params.id);

    if (!record) {
      return res.status(404).json({ 
        success: false, 
        message: 'Medical record not found or access denied' 
      });
    }

    const recordJson = record.toJSON();

    // Generate signed URL if file exists
    if (recordJson.fileKey) {
      try {
        recordJson.fileUrl = await generateSignedUrl(recordJson.fileKey);
      } catch (err) {
        logger.error('Failed to generate signed URL:', err);
        recordJson.fileUrl = null;
      }
    }

    res.json(recordJson);

  } catch (err) {
    logger.error('Get medical record failed:', err);
    next(err);
  }
};

/**
 * @route   DELETE /api/medical/:id
 * @desc    Delete medical record
 * @access  Private (Patient or Doctor who created it)
 */
const deleteMedicalRecord = async (req, res, next) => {
  try {
    const record = await getMedicalRecordById(req.user, req.params.id);

    if (!record) {
      return res.status(404).json({ 
        success: false, 
        message: 'Medical record not found or access denied' 
      });
    }

     // Only allow deletion by patient or doctor who created it
const canDelete = 
  (req.user.role === 'patient' && record.Patient && record.Patient.userId === req.user.id) ||
  (req.user.role === 'doctor' && record.DoctorProfile && record.DoctorProfile.userId === req.user.id) ||
  req.user.role === 'admin';
    if (!canDelete) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to delete this record' 
      });
    }

    // Delete associated file if exists
    if (record.fileKey) {
      try {
        await deleteFile(record.fileKey);
        logger.info('File deleted with medical record', { 
          recordId: record.id,
          fileKey: record.fileKey 
        });
      } catch (err) {
        logger.error('Failed to delete file:', err);
        // Continue with record deletion even if file deletion fails
      }
    }

    // Soft delete the record
    await record.destroy();

    logger.info('Medical record deleted', { 
      userId: req.user.id, 
      recordId: record.id 
    });

    res.json({ 
      success: true, 
      message: 'Medical record deleted successfully' 
    });

  } catch (err) {
    logger.error('Delete medical record failed:', err);
    next(err);
  }
};

module.exports = {
  createMedicalRecord,
  getMyMedicalRecords,
  getMedicalRecord,
  deleteMedicalRecord
};