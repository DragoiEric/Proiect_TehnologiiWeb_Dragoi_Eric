const { DataTypes } = require('sequelize');
const sequelize = require('../core/db');

const ProjectMember = sequelize.define(
  'ProjectMember',
  {
    projectId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    isLeader: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: 'ProjectMember',
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = ProjectMember;
