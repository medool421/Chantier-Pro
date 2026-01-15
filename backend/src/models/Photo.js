const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Photo = sequelize.define('Photo', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  taskId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'tasks',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  reportId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'reports',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  url: {
    type: DataTypes.STRING(500),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'L\'URL de la photo ne peut pas être vide',
      },
    },
  },
  caption: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  takenAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'photos',
  timestamps: false,
  underscored: true,
  indexes: [
    { fields: ['task_id'] },
    { fields: ['report_id'] },
    { fields: ['user_id'] },
    { fields: ['taken_at'] },
  ],
  validate: {
    eitherTaskOrReport() {
      if ((this.taskId && this.reportId) || (!this.taskId && !this.reportId)) {
        throw new Error('La photo doit être liée soit à une tâche, soit à un rapport');
      }
    },
  },
});

module.exports = Photo;