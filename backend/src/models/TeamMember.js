const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/database');

const TeamMember = sequelize.define('TeamMember', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },

  roleInTeam: { type: DataTypes.STRING },
  joinedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'team_members',
  timestamps: false,
});

module.exports = TeamMember;
