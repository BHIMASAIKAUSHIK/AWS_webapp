
module.exports = (sequelize,DataTypes) =>{

    const HealthCheck = sequelize.define('HealthCheck', {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        date: {
          type: DataTypes.DATE,
          allowNull: false,
        },
      });

      return HealthCheck; 

};