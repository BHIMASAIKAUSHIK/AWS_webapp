'use strict';

const path = require('path');
const fs = require('fs');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(path.join(__dirname, '/../config/config.js'))[env]; 
const db = {};

// Initialize Sequelize instance
let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: config.dialect
  });
}
 
// Test database connection
// sequelize.authenticate()
//   .then(() => {
//     console.log('Connection has been established successfully.');
//     return true;
//   })
//   .catch((error) => {
//     console.error('Unable to connect to the database:', error);
//     return false;
//   });

async function checkDatabaseConnection() {
  try {
      await sequelize.authenticate();
      return true;
  } catch (error) {
      console.error("Database connection failed:", error.message);
      return false;
  }
}



// Dynamically load all models in the directory
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Apply associations (if defined in the models)
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.HealthCheck = require('./user')(sequelize, Sequelize.DataTypes);
db.File = require('./file')(sequelize, Sequelize.DataTypes);


module.exports = {db,checkDatabaseConnection,HealthCheck: db.HealthCheck,File: db.File};