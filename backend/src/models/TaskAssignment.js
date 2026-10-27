const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TaskAssignment = sequelize.define('TaskAssignment', {
  taskId: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
  userId: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
  assignedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  assignedBy: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'task_assignments',
  timestamps: false,
});

module.exports = TaskAssignment;
