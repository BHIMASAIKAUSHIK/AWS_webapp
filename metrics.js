// metrics.js
const StatsD = require('node-statsd');
const client = new StatsD({
  host: 'localhost',
  port: 8125,
  prefix: 'csye6225.'
});

// Helper functions for metrics
const metrics = {
  // Count API calls
  incrementApiCall: (method, path) => {
    const cleanPath = path.replace(/\//g, '_').replace(/:/g, '');
    client.increment(`api.count.${method}.${cleanPath}`);
  },
  
  // Measure API response time
  measureApiTime: (method, path, timeMs) => {
    const cleanPath = path.replace(/\//g, '_').replace(/:/g, '');
    client.timing(`api.response_time.${method}.${cleanPath}`, timeMs);
  },
  
  // Measure database query time
  measureDbTime: (operation, timeMs) => {
    client.timing(`db.query_time.${operation}`, timeMs);
  },
  
  // Measure S3 operation time
  measureS3Time: (operation, timeMs) => {
    client.timing(`s3.operation_time.${operation}`, timeMs);
  }
};
// Add this at the end of your metrics.js file
// Function to close the StatsD client
metrics.close = function() {
    if (client && client.socket) {
      client.socket.close();
    }
  };
  

module.exports = metrics;