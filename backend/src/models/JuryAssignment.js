const { DataTypes } = require('sequelize');
const sequelize = require('../core/db');

const JuryAssignment = sequelize.define(
  'JuryAssignment',
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
    assignedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'JuryAssignment',
    freezeTableName: true,
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['deliverableId', 'jurorId'],
      },
    ],
  }
);

module.exports = JuryAssignment;
