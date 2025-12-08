const { DataTypes } = require('sequelize');
const sequelize = require('../core/db');

const GroupCourseOffering = sequelize.define(
  'GroupCourseOffering',
  {
    groupId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    courseOfferingId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
  },
  {
    tableName: 'GroupCourseOffering',
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = GroupCourseOffering;
