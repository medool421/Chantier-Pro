const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TeamMember = sequelize.define('TeamMember', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  teamId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'teams',
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
    onDelete: 'CASCADE',
  },
  role: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Rôle dans l\'équipe (ex: Chef équipe, Électricien, Assistant)',
  },
  joinedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'team_members',
  timestamps: false,
  underscored: true,
  indexes: [
    { fields: ['team_id'] },
    { fields: ['user_id'] },
    { fields: ['is_active'] },
    { fields: ['team_id', 'user_id'], unique: true },
  ],
});

module.exports = TeamMember;