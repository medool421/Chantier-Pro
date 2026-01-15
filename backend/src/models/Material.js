const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Material = sequelize.define('Material', {
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
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Le nom du matériau ne peut pas être vide',
      },
    },
  },
  referenceCode: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  category: {
    type: DataTypes.ENUM('CABLES', 'CIRCUIT_BREAKERS', 'CONDUITS', 'TOOLS', 'OTHER'),
    allowNull: false,
    defaultValue: 'OTHER',
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
    },
  },
  unit: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Unité de mesure (kg, m, unités, etc.)',
  },
  location: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Emplacement physique sur le chantier',
  },
  threshold: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Seuil de stock faible',
  },
  imageUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
}, {
  tableName: 'materials',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['project_id'] },
    { fields: ['category'] },
    { fields: ['reference_code'] },
  ],
});

// Méthode d'instance pour vérifier si le stock est faible
Material.prototype.isLowStock = function () {
  if (!this.threshold) return false;
  return this.quantity < this.threshold;
};

module.exports = Material;