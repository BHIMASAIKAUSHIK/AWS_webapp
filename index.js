// require('dotenv').config();

// const express = require('express');
// const bodyParser = require('body-parser');
// const { db, checkDatabaseConnection } = require('./models');
// const { checkS3Connection } = require('./services/s3Service');
// const fileRoutes = require('./routes/fileroutes.js');


// const app = express();
// app.use(bodyParser.json());

// const port = process.env.PORT || 8080;

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));




// app.use('/', fileRoutes); // Add this line


// // Define routes before starting the server
// app.get("/healthz", async (req, res) => {
//     if (req.body && Object.keys(req.body).length > 0) {
//         res.setHeader("Cache-Control", "no-cache");
//         return res.status(400).end();
//     }

//     if (req.query && Object.keys(req.query).length > 0) {
//       res.setHeader("Cache-Control", "no-cache");
//       return res.status(400).end();
//   }


//     try {
//         const isDbConnected = await checkDatabaseConnection();
//         if (!isDbConnected) {
//             res.setHeader("Cache-Control", "no-cache");
//             return res.status(503).json({ error: "Database connection failed" });
//         }

//         console.log("SANTU 1");

//         if (process.env.NODE_ENV !== 'test') {
//             const isS3Connected = await checkS3Connection();
//             if (!isS3Connected) {
//                 res.setHeader("Cache-Control", "no-cache");
//                 console.log("santu 1.5");
//                 return res.status(503).json({ error: "S3 connection failed" });
//             }
//         }

//         await db.HealthCheck.create({ date: new Date() });
//         console.log("SANTU 2");

//         res.setHeader("Cache-Control", "no-cache");
//         res.status(200).json({ message: "Success" });

//     } catch (error) {
//         console.error("Database insert failed:", error.message);
//         res.setHeader("Cache-Control", "no-cache");
//         res.sendStatus(503);
//     }
// });

// app.all("/healthz", (req, res) => {
//     res.setHeader("Cache-Control", "no-cache");
//     res.setHeader("Allow", "GET");
//     res.sendStatus(405);
// });

// // Start server only if not in test mode
// if (process.env.NODE_ENV !== 'test') {
//     db.sequelize.sync().then(() => {
//         app.listen(port, () => {
//             console.log(`Listening on port ${port}`);
//             console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
//             console.log(`S3 Bucket: ${process.env.S3_BUCKET_NAME || 'Not configured'}`);
//         });
//     }).catch((error) => {
//         console.error("Database synchronization failed:", error.message);
//     });
// }

// // Export app for testing
// module.exports = app;

// index.js
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const { db, checkDatabaseConnection } = require('./models');
const { checkS3Connection } = require('./services/s3Service');
const fileRoutes = require('./routes/fileroutes.js');
const logger = require('./logger');
const metrics = require('./metrics');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const port = process.env.PORT || 8080;

// Middleware for request metrics
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Increment API call count
  metrics.incrementApiCall(req.method, req.path);
  
  // Log the request
  logger.info(`Request: ${req.method} ${req.originalUrl}`, {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // Capture original end function
  const originalEnd = res.end;
  
  // Override end function to capture timing data
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    
    // Measure API response time
    metrics.measureApiTime(req.method, req.path, responseTime);
    
    // Log the response
    logger.info(`Response: ${req.method} ${req.originalUrl} ${res.statusCode}`, {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      responseTimeMs: responseTime
    });
    
    // Call the original end function
    return originalEnd.apply(this, args);
  };
  
  next();
});

app.use('/', fileRoutes);

// Define routes before starting the server
app.get("/healthz", async (req, res) => {
    if (req.body && Object.keys(req.body).length > 0) {
        res.setHeader("Cache-Control", "no-cache");
        return res.status(400).end();
    }

    if (req.query && Object.keys(req.query).length > 0) {
      res.setHeader("Cache-Control", "no-cache");
      return res.status(400).end();
    }

    try {
        const isDbConnected = await checkDatabaseConnection();
        if (!isDbConnected) {
            logger.error("Database connection failed in health check");
            res.setHeader("Cache-Control", "no-cache");
            return res.status(503).json({ error: "Database connection failed" });
        }

        logger.info("Database connection successful in health check");

        if (process.env.NODE_ENV !== 'test') {
            const isS3Connected = await checkS3Connection();
            if (!isS3Connected) {
                logger.error("S3 connection failed in health check");
                res.setHeader("Cache-Control", "no-cache");
                return res.status(503).json({ error: "S3 connection failed" });
            }
            logger.info("S3 connection successful in health check");
        }

        await db.HealthCheck.create({ date: new Date() });
        logger.info("Health check record created successfully");

        res.setHeader("Cache-Control", "no-cache");
        res.status(200).json({ message: "Success" });

    } catch (error) {
        logger.error(`Health check failed: ${error.message}`, {
            error: error.message,
            stack: error.stack
        });
        res.setHeader("Cache-Control", "no-cache");
        res.sendStatus(503);
    }
});

app.all("/healthz", (req, res) => {
    logger.warn(`Method not allowed for health check: ${req.method}`);
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Allow", "GET");
    res.sendStatus(405);
});

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
    db.sequelize.sync().then(() => {
        app.listen(port, () => {
            logger.info(`Server started successfully`, {
                port,
                environment: process.env.NODE_ENV || 'development',
                s3Bucket: process.env.S3_BUCKET_NAME || 'Not configured'
            });
            console.log(`Listening on port ${port}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`S3 Bucket: ${process.env.S3_BUCKET_NAME || 'Not configured'}`);
        });
    }).catch((error) => {
        logger.error(`Database synchronization failed: ${error.message}`, {
            error: error.message,
            stack: error.stack
        });
        console.error("Database synchronization failed:", error.message);
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(`Unhandled error: ${err.message}`, {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});


//kaushik//

app.get("/cicd", async (req, res) => {
    if (req.body && Object.keys(req.body).length > 0) {
        res.setHeader("Cache-Control", "no-cache");
        return res.status(400).end();
    }

    if (req.query && Object.keys(req.query).length > 0) {
      res.setHeader("Cache-Control", "no-cache");
      return res.status(400).end();
    }

    try {
        const isDbConnected = await checkDatabaseConnection();
        if (!isDbConnected) {
            logger.error("Database connection failed in health check");
            res.setHeader("Cache-Control", "no-cache");
            return res.status(503).json({ error: "Database connection failed" });
        }

        logger.info("Database connection successful in health check");

        if (process.env.NODE_ENV !== 'test') {
            const isS3Connected = await checkS3Connection();
            if (!isS3Connected) {
                logger.error("S3 connection failed in health check");
                res.setHeader("Cache-Control", "no-cache");
                return res.status(503).json({ error: "S3 connection failed" });
            }
            logger.info("S3 connection successful in health check");
        }

        await db.HealthCheck.create({ date: new Date() });
        logger.info("Health check record created successfully");

        res.setHeader("Cache-Control", "no-cache");
        res.status(200).json({ message: "Success" });

    } catch (error) {
        logger.error(`Health check failed: ${error.message}`, {
            error: error.message,
            stack: error.stack
        });
        res.setHeader("Cache-Control", "no-cache");
        res.sendStatus(503);
    }
});

//kaushik added cicd//

app.all("/cicd", (req, res) => {
    logger.warn(`Method not allowed for health check: ${req.method}`);
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Allow", "GET");
    res.sendStatus(405);
});

// Start server only if not in test mode
// if (process.env.NODE_ENV !== 'test') {
//     db.sequelize.sync().then(() => {
//         app.listen(port, () => {
//             logger.info(`Server started successfully`, {
//                 port,
//                 environment: process.env.NODE_ENV || 'development',
//                 s3Bucket: process.env.S3_BUCKET_NAME || 'Not configured'
//             });
//             console.log(`Listening on port ${port}`);
//             console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
//             console.log(`S3 Bucket: ${process.env.S3_BUCKET_NAME || 'Not configured'}`);
//         });
//     }).catch((error) => {
//         logger.error(`Database synchronization failed: ${error.message}`, {
//             error: error.message,
//             stack: error.stack
//         });
//         console.error("Database synchronization failed:", error.message);
//     });
// }

// // Error handling middleware
// app.use((err, req, res, next) => {
//     logger.error(`Unhandled error: ${err.message}`, {
//         error: err.message,
//         stack: err.stack,
//         path: req.path,
//         method: req.method
//     });
    
//     res.status(500).json({
//         error: 'Internal Server Error',
//         message: err.message
//     });
// });


// Export app for testing
module.exports = app;
