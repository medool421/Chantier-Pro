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
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  type: {
    type: DataTypes.ENUM('TASK_ASSIGNED', 'TASK_COMPLETED', 'LOW_STOCK', 'PROJECT_DELAY', 'TEAM_UPDATE', 'GENERAL'),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Le titre de la notification ne peut pas être vide',
      },
    },
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  relatedEntityId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID de l\'entité liée (task, project, etc.)',
  },
}, {
  tableName: 'notifications',
  timestamps: true,
  underscored: true,
  updatedAt: false, // Pas besoin de updatedAt pour les notifications
  indexes: [
    { fields: ['user_id'] },
    { fields: ['is_read'] },
    { fields: ['type'] },
    { fields: ['created_at'] },
  ],
});

// Méthode d'instance pour marquer comme lu
Notification.prototype.markAsRead = async function () {
  this.isRead = true;
  await this.save();
};

module.exports = Notification;