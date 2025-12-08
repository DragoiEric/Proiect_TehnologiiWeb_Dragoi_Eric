const { DataTypes } = require('sequelize');
const sequelize = require('../core/db');

const DeliverableFile = sequelize.define(
  'DeliverableFile',
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
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fileType: {
      type: DataTypes.ENUM('video', 'document', 'archive', 'image', 'other'),
      allowNull: false,
      defaultValue: 'other',
    },
    isPrimary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    uploadedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'DeliverableFile',
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = DeliverableFile;
