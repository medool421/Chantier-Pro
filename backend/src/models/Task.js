const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  projectId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'projects',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Le titre de la tâche ne peut pas être vide',
      },
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  location: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED'),
    allowNull: false,
    defaultValue: 'TODO',
  },
  priority: {
    type: DataTypes.ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT'),
    allowNull: false,
    defaultValue: 'NORMAL',
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  progressPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 100,
    },
  },
  assignedTo: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'tasks',
  timestamps: true,
  underscored: true, // Convertit automatiquement en snake_case
  indexes: [
    { fields: ['project_id'] },
    { fields: ['assigned_to'] },
    { fields: ['status'] },
    { fields: ['priority'] },
    { fields: ['due_date'] },
  ],
});

// Hook avant mise à jour : gérer les dates automatiquement
Task.beforeUpdate(async (task) => {
  if (task.changed('status')) {
    if (task.status === 'IN_PROGRESS' && !task.startedAt) {
      task.startedAt = new Date();
    }
    if (task.status === 'COMPLETED' && !task.completedAt) {
      task.completedAt = new Date();
      task.progressPercentage = 100;
    }
  }
});

// Méthode d'instance pour vérifier si la tâche est en retard
Task.prototype.isOverdue = function () {
  if (!this.dueDate || this.status === 'COMPLETED') {
    return false;
  }
  return new Date() > new Date(this.dueDate);
};

module.exports = Task;