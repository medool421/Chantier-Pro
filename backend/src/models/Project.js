const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/database');

const Project = sequelize.define('Project', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },

  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  address: { type: DataTypes.TEXT },

  status: {
    type: DataTypes.ENUM('PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED'),
    defaultValue: 'PLANNED',
  },

  progressPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
  },

  startDate: { type: DataTypes.DATEONLY },
  endDate: { type: DataTypes.DATEONLY },
  budget: { type: DataTypes.DECIMAL(10, 2) },
}, {
  tableName: 'projects',
  timestamps: true,
});

module.exports = Project;
