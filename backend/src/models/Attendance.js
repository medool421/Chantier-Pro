const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Attendance = sequelize.define('Attendance', {
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
  projectId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'projects',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  checkInTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  checkOutTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  location: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Géolocalisation du pointage',
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
}, {
  tableName: 'attendance',
  timestamps: true,
  underscored: true,
  updatedAt: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['project_id'] },
    { fields: ['date'] },
    { fields: ['check_in_time'] },
  ],
  validate: {
    checkOutAfterCheckIn() {
      if (this.checkOutTime && this.checkInTime && this.checkOutTime < this.checkInTime) {
        throw new Error('L\'heure de sortie doit être après l\'heure d\'entrée');
      }
    },
  },
});

// Méthode d'instance pour calculer les heures travaillées
Attendance.prototype.getWorkedHours = function () {
  if (!this.checkOutTime) return null;
  
  const diffMs = new Date(this.checkOutTime) - new Date(this.checkInTime);
  const hours = diffMs / (1000 * 60 * 60);
  
  return Math.round(hours * 100) / 100; // Arrondi à 2 décimales
};

module.exports = Attendance;