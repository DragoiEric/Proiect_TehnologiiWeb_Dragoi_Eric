const { DataTypes } = require('sequelize');
const sequelize = require('../core/db');

const Grade = sequelize.define(
  'Grade',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    deliverableId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    jurorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    score: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'Grade',
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = Grade;
