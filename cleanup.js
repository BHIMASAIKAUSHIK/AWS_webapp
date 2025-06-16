// cleanup.js
function closeConnections() {
    // Close any Winston loggers
    try {
      // Get reference to your logger instance if possible
      const logger = require('./logger');
      if (logger && typeof logger.close === 'function') {
        logger.close();
      }
    } catch (e) {
      console.log('Error closing logger:', e.message);
    }
    
    // Close StatsD client
    try {
      // Get reference to your metrics instance if possible
      const metrics = require('./metrics');
      if (metrics && typeof metrics.close === 'function') {
        metrics.close();
      }
    } catch (e) {
      console.log('Error closing metrics:', e.message);
    }
  }
  
  module.exports = { closeConnections };