const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  joinCode: {
    type: DataTypes.STRING,
    unique: true,
  },

}, {
  tableName: 'companies',
  timestamps: true,
});

module.exports = Company;