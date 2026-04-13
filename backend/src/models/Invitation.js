const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Invitation = sequelize.define('Invitation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  role: {
    type: DataTypes.ENUM('MANAGER', 'WORKER'),
    allowNull: false,
  },

  token: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  status: {
    type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED'),
    defaultValue: 'PENDING',
  },

  expiresAt: {
    type: DataTypes.DATE,
  },

  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
  },

  invitedBy: {
    type: DataTypes.UUID,
  },

}, {
  tableName: 'invitations',
  timestamps: true,
});

module.exports = Invitation;