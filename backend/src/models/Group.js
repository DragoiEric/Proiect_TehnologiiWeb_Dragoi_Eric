const { DataTypes } = require('sequelize');
const sequelize = require('../core/db');

const Group = sequelize.define(
  'Group',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'Group',
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = Group;
