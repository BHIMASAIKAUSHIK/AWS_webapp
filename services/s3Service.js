const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const logger = require('../logger');

const metrics = require('../metrics');//kaushik


// Initialize S3 client (will use IAM role)
const s3 = new AWS.S3();
const bucketName = process.env.S3_BUCKET_NAME;

// Check if bucket name is set
// if (!bucketName) {
//   logger.error('S3 bucket name not set in environment variables');
// }

// const uploadFile = async (file) => {
//   logger.info(`Uploading file to S3: ${file.originalname}`);
  
//   // Generate a unique file key
//   const fileKey = uuidv4();
  
//   // Upload file to S3
//   const params = {
//     Bucket: bucketName,
//     Key: fileKey,
//     Body: file.buffer,
//     ContentType: file.mimetype
//   };
  
//   const result = await s3.upload(params).promise();
//   logger.info(`File uploaded successfully to S3 with key: ${fileKey}`);
  
//   // Return file metadata
//   return {
//     fileName: file.originalname,
//     fileKey: fileKey,
//     fileSize: file.size,
//     fileType: file.mimetype,
//     uploadDate: new Date(),
//     s3Url: result.Location
//   };
// };

// const deleteFile = async (fileKey) => {
//   logger.info(`Deleting file from S3 with key: ${fileKey}`);
  
//   const params = {
//     Bucket: bucketName,
//     Key: fileKey
//   };
  
//   await s3.deleteObject(params).promise();
//   logger.info('File deleted successfully from S3');
// };

// // Function to check S3 connectivity
// const checkS3Connection = async () => {
//   try {
//     await s3.headBucket({ Bucket: bucketName }).promise();
//     return true;
//   } catch (error) {
//     logger.error(`S3 connection failed: ${error.message}`);
//     return false;
//   }
// };

// module.exports = {
//   uploadFile,
//   deleteFile,
//   checkS3Connection
// };

if (!bucketName) {
  logger.error('S3 bucket name not set in environment variables');
}

const uploadFile = async (file, fileKey) => {
  const startTime = Date.now();
  logger.info(`Uploading file to S3: ${file.originalname}`, { fileName: file.originalname, fileSize: file.size });
  
  try {
    // Upload file to S3
    const params = {
      Bucket: bucketName,
      Key: fileKey || uuidv4(),
      Body: file.buffer,
      ContentType: file.mimetype
    };
    
    const result = await s3.upload(params).promise();
    
    // Measure S3 operation time
    const operationTime = Date.now() - startTime;
    metrics.measureS3Time('upload', operationTime);
    
    logger.info(`File uploaded successfully to S3`, { 
      fileKey: params.Key, 
      fileSize: file.size, 
      duration: operationTime 
    });
    
    return result;
  } catch (error) {
    const operationTime = Date.now() - startTime;
    logger.error(`S3 upload error: ${error.message}`, { 
      error: error.message,
      stack: error.stack,
      duration: operationTime
    });
    
    throw error;
  }
};

const deleteFile = async (fileKey) => {
  const startTime = Date.now();
  logger.info(`Deleting file from S3`, { fileKey });
  
  try {
    const params = {
      Bucket: bucketName,
      Key: fileKey
    };
    
    await s3.deleteObject(params).promise();
    
    // Measure S3 operation time
    const operationTime = Date.now() - startTime;
    metrics.measureS3Time('delete', operationTime);
    
    logger.info('File deleted successfully from S3', { 
      fileKey,
      duration: operationTime
    });
  } catch (error) {
    const operationTime = Date.now() - startTime;
    logger.error(`S3 delete error: ${error.message}`, {
      fileKey,
      error: error.message,
      stack: error.stack,
      duration: operationTime
    });
    
    throw error;
  }
};

// Function to check S3 connectivity
const checkS3Connection = async () => {
  const startTime = Date.now();
  
  try {
    await s3.headBucket({ Bucket: bucketName }).promise();
    
    const operationTime = Date.now() - startTime;
    metrics.measureS3Time('connectivity_check', operationTime);
    
    logger.info('S3 connection successful', { bucket: bucketName, duration: operationTime });
    return true;
  } catch (error) {
    const operationTime = Date.now() - startTime;
    logger.error(`S3 connection failed: ${error.message}`, {
      bucket: bucketName,
      error: error.message,
      duration: operationTime
    });
    return false;
  }
};

module.exports = {
  uploadFile,
  deleteFile,
  checkS3Connection
};