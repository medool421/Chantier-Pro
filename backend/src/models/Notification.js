const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM(
      'TASK_ASSIGNED',
      'TASK_STATUS_CHANGED',
      'PROJECT_STATUS_CHANGED',
      'MANAGER_ASSIGNED'
    ),
    allowNull: false,
  },
  data: {
    type: DataTypes.JSONB, // use DataTypes.JSON if on MySQL
    defaultValue: {},
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read',
  },
}, {
  tableName: 'notifications',
  timestamps: true,
  underscored: true,
});

// Association — call this from your models/index.js
Notification.associate = (models) => {
  Notification.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user',
  });
};

module.exports = Notification;