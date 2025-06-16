// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const { v4: uuidv4 } = require('uuid');
// const { db } = require('../models');
// const s3Service = require('../services/s3Service');

// // Configure multer for memory storage
// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: {
//     fileSize: 5 * 1024 * 1024 // 5MB limit
//   }
// });

// // POST /v1/file - Upload a file
// router.post('/v1/file', upload.single('profilePic'), async (req, res) => {
//   console.log('File upload request received');
//   console.log('Request file:', req.file);
//   console.log('Request body:', req.body);

//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: 'No file uploaded' });
//     }

//     // Generate a unique file key
//     const fileKey = `${uuidv4()}-${req.file.originalname}`;

//     // Upload file to S3
//     const s3Result = await s3Service.uploadFile(req.file, fileKey);

//     // Save metadata to database
//     const file = await db.File.create({
//       fileName: req.file.originalname,
//       fileKey: fileKey,
//       fileSize: req.file.size,
//       fileType: req.file.mimetype,
//       s3Url: s3Result.Location, // Use the S3 object URL
//       uploadDate: new Date() // Use a full timestamp
//     });

//     // Return success response
//     res.status(201).json({
//       file_name: file.fileName,
//       id: file.id,
//       url: file.s3Url,
//       upload_date: file.uploadDate
//     });
//   } catch (error) {
//     console.error('Error uploading file:', error);
//     res.status(500).json({ error: 'Failed to upload file', details: error.message });
//   }
// });

// // GET /v1/file/{id} - Get file metadata
// router.get('/v1/file/:id', async (req, res) => {
//   try {
//     const fileId = req.params.id;

//     // Find file metadata in database
//     const file = await db.File.findByPk(fileId);

//     if (!file) {
//       return res.status(404).json({ error: 'File not found' });
//     }

//     // Return file metadata
//     res.status(200).json({
//       file_name: file.fileName,
//       id: file.id,
//       url: file.s3Url,
//       upload_date: file.uploadDate
//     });
//   } catch (error) {
//     console.error('Error retrieving file:', error);
//     res.status(500).json({ error: 'Failed to retrieve file', details: error.message });
//   }
// });

// // DELETE /v1/file/{id} - Delete a file
// router.delete('/v1/file/:id', async (req, res) => {
//   try {
//     const fileId = req.params.id;

//     // Find file metadata in database
//     const file = await db.File.findByPk(fileId);

//     if (!file) {
//       return res.status(404).json({ error: 'File not found' });
//     }

//     // Delete from S3 using fileKey
//     await s3Service.deleteFile(file.fileKey);

//     // Delete from database (hard delete)
//     await file.destroy();

//     // Return success with no content
//     res.status(204).end();
//   } catch (error) {
//     console.error('Error deleting file:', error);
//     res.status(500).json({ error: 'Failed to delete file', details: error.message });
//   }
// });

// // GET /v1/file - Always return 400 Bad Request
// router.get('/v1/file', (req, res) => {
//   res.status(400).json({ error: 'Bad Request' });
// });

// // DELETE /v1/file - Always return 400 Bad Request
// router.delete('/v1/file', (req, res) => {
//   res.status(400).json({ error: 'Bad Request' });
// });

// // HEAD, OPTIONS, PATCH, PUT, POST /v1/file - 405 Method Not Allowed
// router.head('/v1/file', (req, res) => {
//   res.status(405).set('Allow', 'GET, POST').end();
// });

// router.options('/v1/file', (req, res) => {
//   res.status(405)
//      .set('Allow', 'GET, POST')
//      .set('Access-Control-Allow-Methods', 'GET, POST')
//      .end();
// });

// router.patch('/v1/file', (req, res) => {
//   res.status(405).set('Allow', 'GET, POST').end();
// });

// router.put('/v1/file', (req, res) => {
//   res.status(405).set('Allow', 'GET, POST').end();
// });

// // HEAD, OPTIONS, PATCH, PUT, POST /v1/file/{id} - 405 Method Not Allowed
// router.head('/v1/file/:id', (req, res) => {
//   res.status(405).set('Allow', 'GET, DELETE').end();
// });

// router.options('/v1/file/:id', (req, res) => {
//   res.status(405)
//      .set('Allow', 'GET, DELETE')
//      .set('Access-Control-Allow-Methods', 'GET, DELETE')
//      .end();
// });

// router.patch('/v1/file/:id', (req, res) => {
//   res.status(405).set('Allow', 'GET, DELETE').end();
// });

// router.put('/v1/file/:id', (req, res) => {
//   res.status(405).set('Allow', 'GET, DELETE').end();
// });

// router.post('/v1/file/:id', (req, res) => {
//   res.status(405).set('Allow', 'GET, DELETE').end();
// });

// module.exports = router;


// routes/fileroutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../models');
const s3Service = require('../services/s3Service');
const logger = require('../logger');
const metrics = require('../metrics');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Database operation wrapper
async function dbOperation(operation, func) {
  const startTime = Date.now();
  try {
    const result = await func();
    const duration = Date.now() - startTime;
    metrics.measureDbTime(operation, duration);
    logger.info(`Database operation: ${operation}`, { operation, duration });
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Database error: ${error.message}`, { 
      operation, 
      error: error.message,
      stack: error.stack,
      duration
    });
    throw error;
  }
}

// POST /v1/file - Upload a file
router.post('/v1/file', upload.single('profilePic'), async (req, res) => {
  logger.info('File upload request received', {
    contentType: req.get('Content-Type'),
    hasFile: !!req.file
  });

  try {
    if (!req.file) {
      logger.warn('File upload failed: No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate a unique file key
    const fileKey = `${uuidv4()}-${req.file.originalname}`;

    // Upload file to S3
    const s3Result = await s3Service.uploadFile(req.file, fileKey);

    // Save metadata to database
    const file = await dbOperation('create_file', async () => {
      return db.File.create({
        fileName: req.file.originalname,
        fileKey: fileKey,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        s3Url: s3Result.Location,
        uploadDate: new Date()
      });
    });

    logger.info('File uploaded successfully', {
      fileId: file.id,
      fileName: file.fileName,
      fileSize: file.fileSize
    });

    // Return success response
    res.status(201).json({
      file_name: file.fileName,
      id: file.id,
      url: file.s3Url,
      upload_date: file.uploadDate
    });
  } catch (error) {
    logger.error(`Error uploading file: ${error.message}`, {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Failed to upload file', details: error.message });
  }
});

// GET /v1/file/{id} - Get file metadata
router.get('/v1/file/:id', async (req, res) => {
  const fileId = req.params.id;
  logger.info('File metadata request received', { fileId });

  try {
    // Find file metadata in database
    const file = await dbOperation('find_file_by_id', async () => {
      return db.File.findByPk(fileId);
    });

    if (!file) {
      logger.warn('File not found', { fileId });
      return res.status(404).json({ error: 'File not found' });
    }

    logger.info('File metadata retrieved successfully', { fileId });

    // Return file metadata
    res.status(200).json({
      file_name: file.fileName,
      id: file.id,
      url: file.s3Url,
      upload_date: file.uploadDate
    });
  } catch (error) {
    logger.error(`Error retrieving file: ${error.message}`, {
      fileId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Failed to retrieve file', details: error.message });
  }
});

// DELETE /v1/file/{id} - Delete a file
router.delete('/v1/file/:id', async (req, res) => {
  const fileId = req.params.id;
  logger.info('File deletion request received', { fileId });

  try {
    // Find file metadata in database
    const file = await dbOperation('find_file_by_id', async () => {
      return db.File.findByPk(fileId);
    });

    if (!file) {
      logger.warn('File not found', { fileId });
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete from S3 using fileKey
    await s3Service.deleteFile(file.fileKey);

    // Delete from database (hard delete)
    await dbOperation('delete_file', async () => {
      return file.destroy();
    });

    logger.info('File deleted successfully', { fileId, fileKey: file.fileKey });

    // Return success with no content
    res.status(204).end();
  } catch (error) {
    logger.error(`Error deleting file: ${error.message}`, {
      fileId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Failed to delete file', details: error.message });
  }
});

// GET /v1/file - Always return 400 Bad Request
router.get('/v1/file', (req, res) => {
  logger.warn('Invalid request: GET /v1/file without ID');
  res.status(400).json({ error: 'Bad Request' });
});

// DELETE /v1/file - Always return 400 Bad Request
router.delete('/v1/file', (req, res) => {
  logger.warn('Invalid request: DELETE /v1/file without ID');
  res.status(400).json({ error: 'Bad Request' });
});

// HEAD, OPTIONS, PATCH, PUT, POST /v1/file - 405 Method Not Allowed
router.head('/v1/file', (req, res) => {
  logger.warn('Method not allowed: HEAD /v1/file');
  res.status(405).set('Allow', 'GET, POST').end();
});

router.options('/v1/file', (req, res) => {
  logger.warn('Method not allowed: OPTIONS /v1/file');
  res.status(405)
     .set('Allow', 'GET, POST')
     .set('Access-Control-Allow-Methods', 'GET, POST')
     .end();
});

router.patch('/v1/file', (req, res) => {
  logger.warn('Method not allowed: PATCH /v1/file');
  res.status(405).set('Allow', 'GET, POST').end();
});

router.put('/v1/file', (req, res) => {
  logger.warn('Method not allowed: PUT /v1/file');
  res.status(405).set('Allow', 'GET, POST').end();
});

// HEAD, OPTIONS, PATCH, PUT, POST /v1/file/{id} - 405 Method Not Allowed
router.head('/v1/file/:id', (req, res) => {
  logger.warn('Method not allowed: HEAD /v1/file/:id');
  res.status(405).set('Allow', 'GET, DELETE').end();
});

router.options('/v1/file/:id', (req, res) => {
  logger.warn('Method not allowed: OPTIONS /v1/file/:id');
  res.status(405)
     .set('Allow', 'GET, DELETE')
     .set('Access-Control-Allow-Methods', 'GET, DELETE')
     .end();
});

router.patch('/v1/file/:id', (req, res) => {
  logger.warn('Method not allowed: PATCH /v1/file/:id');
  res.status(405).set('Allow', 'GET, DELETE').end();
});

router.put('/v1/file/:id', (req, res) => {
  logger.warn('Method not allowed: PUT /v1/file/:id');
  res.status(405).set('Allow', 'GET, DELETE').end();
});

router.post('/v1/file/:id', (req, res) => {
  logger.warn('Method not allowed: POST /v1/file/:id');
  res.status(405).set('Allow', 'GET, DELETE').end();
});

module.exports = router;