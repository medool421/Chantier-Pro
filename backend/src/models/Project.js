const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Le nom du projet ne peut pas être vide',
      },
    },
  },
  referenceCode: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  location: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  priority: {
    type: DataTypes.ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT'),
    allowNull: false,
    defaultValue: 'NORMAL',
  },
  status: {
    type: DataTypes.ENUM('PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'DELAYED', 'COMPLETED', 'CANCELLED'),
    allowNull: false,
    defaultValue: 'PLANNED',
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  endDate: {
    type: DataTypes.DATEONLY,
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
  budget: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    validate: {
      min: 0,
    },
  },
  managerId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'projects',
  timestamps: true,
  underscored: true, // Convertit automatiquement en snake_case
  indexes: [
    { fields: ['manager_id'] },
    { fields: ['status'] },
    { fields: ['priority'] },
    { fields: ['reference_code'], unique: true },
  ],
});

// Hook avant création : générer un code de référence unique
Project.beforeCreate(async (project) => {
  if (!project.referenceCode) {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    project.referenceCode = `PRJ-${year}-${randomNum}`;
  }
});

// Méthode d'instance pour calculer les jours restants
Project.prototype.getDaysRemaining = function () {
  if (!this.endDate) return null;
  
  const today = new Date();
  const end = new Date(this.endDate);
  const diffTime = end - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

module.exports = Project;