const { DataTypes } = require('sequelize');
const sequelize = require('../core/db');

const GroupMember = sequelize.define(
  'GroupMember',
  {
    groupId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
  },
  {
    tableName: 'GroupMember',
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = GroupMember;
