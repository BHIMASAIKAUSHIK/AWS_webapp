module.exports = (sequelize, DataTypes) => {
    const File = sequelize.define('File', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      fileName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      fileKey: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      fileSize: {
        type: DataTypes.BIGINT
      },
      fileType: {
        type: DataTypes.STRING
      },
      uploadDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      },
      s3Url: {
        type: DataTypes.STRING
      }
    });
  
    return File;
  };