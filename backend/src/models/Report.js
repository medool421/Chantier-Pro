const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/database');

const Report = sequelize.define('Report', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },

  type: {
    type: DataTypes.ENUM('DAILY', 'WEEKLY', 'INCIDENT'),
    allowNull: false,
  },

  title: { type: DataTypes.STRING, allowNull: false },
  content: { type: DataTypes.TEXT },

  reportDate: { type: DataTypes.DATEONLY, allowNull: false },
}, {
  tableName: 'reports',
  timestamps: true,
});

module.exports = Report;
