const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/database');

const File = sequelize.define('File', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },

  url: { type: DataTypes.STRING, allowNull: false },
  caption: { type: DataTypes.TEXT },

  type: {
    type: DataTypes.ENUM('BEFORE', 'AFTER', 'ISSUE'),
    allowNull: false,
  },

  takenAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'files',
  timestamps: false,
});

module.exports = File;
