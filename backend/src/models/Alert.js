const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Alert = sequelize.define('Alert', {
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
  severity: {
    type: DataTypes.ENUM('INFO', 'WARNING', 'CRITICAL'),
    allowNull: false,
    defaultValue: 'INFO',
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Le titre de l\'alerte ne peut pas être vide',
      },
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'RESOLVED'),
    allowNull: false,
    defaultValue: 'ACTIVE',
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'alerts',
  timestamps: true,
  underscored: true,
  updatedAt: false,
  indexes: [
    { fields: ['project_id'] },
    { fields: ['severity'] },
    { fields: ['status'] },
    { fields: ['created_at'] },
  ],
});

// Hook avant mise à jour : enregistrer la date de résolution
Alert.beforeUpdate(async (alert) => {
  if (alert.changed('status') && alert.status === 'RESOLVED' && !alert.resolvedAt) {
    alert.resolvedAt = new Date();
  }
});

// Méthode d'instance pour résoudre l'alerte
Alert.prototype.resolve = async function () {
  this.status = 'RESOLVED';
  this.resolvedAt = new Date();
  await this.save();
};

module.exports = Alert;