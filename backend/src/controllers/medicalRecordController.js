// const { MedicalRecord, PatientProfile, DoctorProfile } = require('../models');

// const multer = require('multer');



// const createRecord = async (req, res, next) => {

//   try {

//     // If file upload middleware was successful, file data is in req.file

//     const filePath = req.file ? `/uploads/${req.file.filename}` : null; // <--- **NEW LINE**



//     // NOTE: The `date` field in req.body might need renaming to `recordDate` to match the model.

//     // Let's rename the incoming 'date' to 'recordDate' for clarity/model matching.

//     const { patientId, title, description, date } = req.body;

//     const doctorId = req.user.doctorProfileId;



//     // **ERROR CHECK**: Ensure doctor has a profile linked to create records

//     // NOTE: This check depends on whether req.user has doctorProfileId or if we need to fetch DoctorProfile.

//     // Given the current protect middleware only puts ID/Role, we must fetch the profile ID.



//     const doctorProfile = await DoctorProfile.findOne({ where: { userId: req.user.id } });

//     if (!doctorProfile) {

//       // If the user is a Doctor/Admin but hasn't created a DoctorProfile, they cannot create a record linked to them.

//       return res.status(403).json({ success: false, message: 'Doctor profile must be completed before creating records.' });

//     }

//     const finalDoctorId = doctorProfile.id; // Use the DoctorProfile ID here, not the User ID



//     const record = await MedicalRecord.create({

//       patientId,

//       doctorId: finalDoctorId, // <--- **UPDATED**

//       title,

//       description,

//       recordDate: date,

//       filePath

//     });



//     res.status(201).json({ success: true, record: { ...record.toJSON(), filePath } });

//   } catch (err) {

//     // If multer errors (e.g., file type rejected), it will be caught here.

//     if (err instanceof multer.MulterError) {

//       return res.status(400).json({ success: false, message: 'File upload error: ' + err.message });

//     }

//     next(err);

//   }

// };



// const getPatientRecords = async (req, res, next) => {

//   try {

//     let targetPatientProfileId = req.params.patientId;

//     const userRole = req.user.role;

//     const currentUserId = req.user.id;



//     // SCENARIO 1: If the current user is a patient, they can only view their OWN records.

//     if (userRole === 'patient') {

//       // Find the PatientProfile associated with the current User ID

//       const patientProfile = await PatientProfile.findOne({ where: { userId: currentUserId } });



//       if (!patientProfile) {

//         return res.status(404).json({ success: false, message: 'Patient profile not found.' });

//       }



//       // Ensure the ID being requested matches the user's own profile ID for security

//       // The frontend *should* send the correct ID, but we enforce it here.

//       targetPatientProfileId = patientProfile.id;

//     }

//     // SCENARIO 2: If the current user is a doctor/admin, the requested ID (req.params.patientId) is assumed

//     // to be the PatientProfile ID, and we proceed to fetch it.

//     // NOTE: For doctors/admins, we must verify that the requested ID is indeed a valid PatientProfile ID.

//     // We can do a quick check, which also ensures the PatientProfile exists for creating records.



//     const patientProfileCheck = await PatientProfile.findByPk(targetPatientProfileId);

//     if (!patientProfileCheck) {

//       return res.status(404).json({ success: false, message: 'Target Patient ID does not correspond to a valid profile.' });

//     }



//     // Final check for unauthorized access in Scenario 2 is handled by `requirePatientOrDoctor` middleware,

//     // which ensures only authorized roles reach this point.



//     const records = await MedicalRecord.findAll({

//       where: { patientId: targetPatientProfileId }, // Use the verified profile ID

//       include: [

//         // We can also include PatientProfile here, but let's stick to DoctorProfile for now

//         { model: DoctorProfile, attributes: ['id', 'specialty', 'licenseNumber'] }

//       ],

//       order: [['recordDate', 'DESC']] // Show newest records first

//     });



//     res.json({ success: true, records });

//   } catch (err) {

//     next(err);

//   }

// };



// const updateRecord = async (req, res, next) => {

//   try {

//     const { id } = req.params;

//     const { title, description, date } = req.body;



//     const record = await MedicalRecord.findByPk(id);

//     if (!record) return res.status(404).json({ success: false, message: 'Record not found' });



//     await record.update({ title, description, date });

//     res.json({ success: true, record });

//   } catch (err) {

//     next(err);

//   }

// };



// const deleteRecord = async (req, res, next) => {

//   try {

//     const { id } = req.params;

//     const record = await MedicalRecord.findByPk(id);

//     if (!record) return res.status(404).json({ success: false, message: 'Record not found' });



//     await record.destroy();

//     res.json({ success: true, message: 'Record deleted' });

//   } catch (err) {

//     next(err);

//   }

// };



// module.exports = {

//   createRecord,

//   getPatientRecords,

//   updateRecord,

//   deleteRecord

// };
 

const { MedicalRecord, PatientProfile, DoctorProfile, sequelize } = require('../models');
const multer = require('multer'); // Still needed for MulterError handling
const aws = require('aws-sdk'); // Import AWS SDK for S3 operations
const fs = require('fs'); // Still needed for local cleanup if S3 setup fails
const path = require('path'); 

// Configure S3 instance (using configuration loaded from .env/index.js)
const s3 = new aws.S3(); 
const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME; 

// --- Helper function for local file deletion (ONLY used as a fallback/error cleanup) ---
const getFullPath = (filePath) => {
    // Only resolves if using local storage (which we shouldn't be now)
    if (!filePath || filePath.startsWith('/uploads/')) {
        return path.join(__dirname, '../../', filePath.replace('/uploads/', 'uploads/'));
    }
    return null; // Not for S3 files
};

// --- Helper function for S3 file deletion ---
const deleteS3Object = async (s3Key) => {
    if (!s3Key || s3Key.startsWith('/uploads/')) return; // Skip if it's a local path

    const params = {
        Bucket: S3_BUCKET_NAME,
        Key: s3Key 
    };

    try {
        await s3.deleteObject(params).promise();
        console.log(`✅ Successfully deleted S3 file: ${s3Key}`);
    } catch (err) {
        console.error(`❌ Warning: Failed to delete S3 file ${s3Key}:`, err);
        // Do not throw; log error and allow transaction to commit.
    }
};

// 1. CREATE RECORD (Doctor/Admin Only)
const createRecord = async (req, res, next) => {
    const transaction = await sequelize.transaction(); // Use transaction for data integrity
    try {
        // filePath now contains the S3 Key (e.g., 'medical-files/user_id/...')
        // If S3 upload succeeded via multerS3, data is in req.file.key (or req.file.location if public access)
        const filePath = req.file ? req.file.key : null; 
        
        const { patientId, title, description, date } = req.body;
        
        // 1. Find Doctor Profile and validate authority
        const doctorProfile = await DoctorProfile.findOne({ where: { userId: req.user.id }, transaction });

        if (!doctorProfile) {
            await transaction.rollback();
            return res.status(403).json({ 
                success: false, 
                message: 'Doctor profile must be completed before creating records.' 
            });
        }
        
        // CRITICAL SECURITY CHECK: Check Doctor Verification (from Step 8 and 22)
        if (doctorProfile.role === 'doctor' && !doctorProfile.isVerified) {
             await transaction.rollback();
             return res.status(403).json({ 
                success: false, 
                message: 'Your doctor profile is pending admin verification and cannot create records.' 
            });
        }

        const finalDoctorId = doctorProfile.id; 

        // 2. Create the Medical Record
        const record = await MedicalRecord.create({
            patientId,
            doctorId: finalDoctorId,
            title,
            description,
            recordDate: date,
            filePath // S3 key stored here
        }, { transaction });

        await transaction.commit();

        res.status(201).json({ success: true, record: { ...record.toJSON(), filePath } });
    } catch (err) {
        await transaction.rollback();
        // If DB insertion failed, delete the file uploaded to S3/local disk
        if (req.file?.key) {
            await deleteS3Object(req.file.key);
        } else if (req.file?.path) {
            // Fallback for old local storage
            fs.unlink(req.file.path, () => {}); 
        }

        if (err instanceof multer.MulterError) {
             return res.status(400).json({ success: false, message: 'File upload error: ' + err.message });
        }
        
        console.error('Record creation error:', err);
        next(err);
    }
};


// 2. GET PATIENT RECORDS (Patient/Doctor/Admin)
const getPatientRecords = async (req, res, next) => {
    try {
        let targetPatientProfileId = req.params.patientId;
        const userRole = req.user.role;
        const currentUserId = req.user.id;

        // ... (omitted user role check logic from Step 16) ...
        if (userRole === 'patient') {
            const patientProfile = await PatientProfile.findOne({ where: { userId: currentUserId } });
            if (!patientProfile) {
                return res.status(404).json({ success: false, message: 'Patient profile not found.' });
            }
            targetPatientProfileId = patientProfile.id;
        }

        const patientProfileCheck = await PatientProfile.findByPk(targetPatientProfileId);
        if (!patientProfileCheck) {
            return res.status(404).json({ 
                success: false, 
                message: 'Target Patient ID does not correspond to a valid profile.' 
            });
        }
        
        // Fetch records, ensuring alias fix is used
        const records = await MedicalRecord.findAll({
            where: { patientId: targetPatientProfileId }, 
            include: [
                { 
                    model: DoctorProfile, 
                    as: 'DoctorProfile', // CRITICAL FIX: Use the alias defined in index.js
                    attributes: ['id', 'specialty', 'licenseNumber', 'isVerified'] 
                }
            ],
            order: [['recordDate', 'DESC']]
        });

        res.json({ success: true, records });
    } catch (err) {
        next(err);
    }
};


// 3. GET RECORD FILE URL (NEW SECURE ACCESS ROUTE - from Step 49)
const getRecordFileUrl = async (req, res, next) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user.id;
        const userRole = req.user.role;

        const record = await MedicalRecord.findByPk(id, {
            // Need patient's User ID to verify ownership if userRole is patient
            include: [{ model: PatientProfile, as: 'Patient', attributes: ['userId', 'id'] }]
        });
        
        if (!record || !record.filePath) {
            return res.status(404).json({ success: false, message: 'Record or file not found.' });
        }
        
        const patientProfileId = record.patientId;
        
        // --- Authorization Check (Simplified, relies on Role Middleware) ---
        // For patient role, verify they own the record
        if (userRole === 'patient') {
            const userProfile = await PatientProfile.findOne({ where: { userId: currentUserId } });
            if (userProfile?.id !== patientProfileId) {
                 return res.status(403).json({ success: false, message: 'Access denied. You do not own this record.' });
            }
        }
        // Doctors/Admins are allowed because they passed `requirePatientOrDoctor` middleware.

        // Generate Pre-Signed URL from S3 Key (filePath)
        const s3Key = record.filePath; 
        
        const url = s3.getSignedUrl('getObject', {
            Bucket: S3_BUCKET_NAME,
            Key: s3Key,
            Expires: 60 // URL valid for 60 seconds (security)
        });

        res.status(200).json({ success: true, fileUrl: url });

    } catch (err) {
        console.error('Error generating S3 URL:', err);
        next(err);
    }
};


// 4. UPDATE RECORD (Doctor/Admin Only)
const updateRecord = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, description, date } = req.body; 

        const record = await MedicalRecord.findByPk(id);
        if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
        
        // FUTURE IMPROVEMENT: Add check here: Only Admin OR creator doctor can update.

        await record.update({ 
            title, 
            description, 
            recordDate: date 
        });
        
        res.json({ success: true, record });
    } catch (err) {
        next(err);
    }
};


// 5. DELETE RECORD (Doctor/Admin Only)
const deleteRecord = async (req, res, next) => {
    const transaction = await sequelize.transaction(); // Use transaction for data integrity
    try {
        const { id } = req.params;
        const record = await MedicalRecord.findByPk(id, { transaction });
        
        if (!record) {
             await transaction.rollback();
             return res.status(404).json({ success: false, message: 'Record not found' });
        }
        
        const filePath = record.filePath; // S3 Key

        // 1. Perform deletion from DB
        await record.destroy({ transaction });

        await transaction.commit(); // Commit DB change

        // 2. CRITICAL: Delete the associated file from S3 (Asynchronous and outside the transaction)
        if (filePath) {
            // Note: If this fails, the DB record is already gone, which is acceptable (error logged).
            await deleteS3Object(filePath); 
        }

        res.json({ success: true, message: 'Record deleted successfully' });
    } catch (err) {
        await transaction.rollback(); // Rollback if DB operation failed
        next(err);
    }
};


module.exports = {
    createRecord,
    getPatientRecords,
    updateRecord,
    deleteRecord,
    getRecordFileUrl // FINAL EXPORT
};