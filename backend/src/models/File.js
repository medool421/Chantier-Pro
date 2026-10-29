const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/database');

const File = sequelize.define('File', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },

  url: { type: DataTypes.STRING, allowNull: false },
  originalName: { type: DataTypes.STRING, allowNull: false },
  mimeType: { type: DataTypes.STRING, allowNull: false },
  size: { type: DataTypes.INTEGER, allowNull: false },
  caption: { type: DataTypes.TEXT },

  projectId: { type: DataTypes.UUID, allowNull: false },
  taskId: { type: DataTypes.UUID, allowNull: true },
  reportId: { type: DataTypes.UUID, allowNull: true },
  uploadedBy: { type: DataTypes.UUID, allowNull: false },

  type: {
    type: DataTypes.ENUM('BEFORE', 'AFTER', 'ISSUE', 'PLANS', 'UPDATES', 'NORMS', 'OTHER'),
    allowNull: false,
  },

  takenAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'files',
  timestamps: true,
});

module.exports = File;
