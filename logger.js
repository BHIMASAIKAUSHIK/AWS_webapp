// logger.js
const winston = require('winston');

// Create logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'webapp' },
  transports: [
    // Write to app.log file
    new winston.transports.File({ filename: '/opt/csye6225/webapp/logs/app.log' })
  ]
});

// Add this at the end of your logger.js file
// Allow closing the logger (important for tests)

// Add console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

logger.close = function() {
    // Close all transports
    this.transports.forEach((transport) => {
      if (transport.close) {
        transport.close();
      }
    });
  };
  

module.exports = logger;

