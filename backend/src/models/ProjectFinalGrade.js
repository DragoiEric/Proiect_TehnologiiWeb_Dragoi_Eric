const { DataTypes } = require('sequelize');
const sequelize = require('../core/db');

const ProjectFinalGrade = sequelize.define(
  'ProjectFinalGrade',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    deliverableId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    finalScore: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
    },
    calculatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'ProjectFinalGrade',
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = ProjectFinalGrade;
