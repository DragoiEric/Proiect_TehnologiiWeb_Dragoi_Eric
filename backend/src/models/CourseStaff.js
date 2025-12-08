const { DataTypes } = require('sequelize');
const sequelize = require('../core/db');

const CourseStaff = sequelize.define(
  'CourseStaff',
  {
    courseOfferingId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    role: {
      type: DataTypes.ENUM('lecturer', 'assistant', 'lab', 'other'),
      allowNull: false,
      defaultValue: 'other',
    },
  },
  {
    tableName: 'CourseStaff',
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = CourseStaff;
