const { DataTypes } = require('sequelize');
const sequelize = require('../core/db');

const CourseOffering = sequelize.define(
  'CourseOffering',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    academicYear: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    semester: {
      type: DataTypes.ENUM('autumn', 'spring', 'summer'),
      allowNull: false,
    },
    mainProfessorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'CourseOffering',
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = CourseOffering;
