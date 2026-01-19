const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/database');

const Task = sequelize.define('Task', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },

  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },

  status: {
    type: DataTypes.ENUM('TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED'),
    defaultValue: 'TODO',
  },

  priority: {
    type: DataTypes.ENUM('LOW', 'NORMAL', 'HIGH'),
    defaultValue: 'NORMAL',
  },

  dueDate: { type: DataTypes.DATEONLY },

  progressPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
  },
}, {
  tableName: 'tasks',
  timestamps: true,
});

module.exports = Task;
