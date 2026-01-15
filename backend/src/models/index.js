    const { sequelize } = require('../config/database');

// Import de tous les modèles
const User = require('./User');
const Project = require('./Project');
const Task = require('./Task');
const Team = require('./Team');
const TeamMember = require('./TeamMember');
const Material = require('./Material');
const Report = require('./Report');
const Photo = require('./Photo');
const Notification = require('./Notification');
const Alert = require('./Alert');
const Attendance = require('./Attendance');

// DÉFINITION DES ASSOCIATIONS

// ==================== USER ====================

// User <-> Project (Manager)
User.hasMany(Project, {
  foreignKey: 'managerId',
  as: 'managedProjects',
  onDelete: 'SET NULL',
});

Project.belongsTo(User, {
  foreignKey: 'managerId',
  as: 'manager',
});

// User <-> Task (Assigned To)
User.hasMany(Task, {
  foreignKey: 'assignedTo',
  as: 'assignedTasks',
  onDelete: 'SET NULL',
});

Task.belongsTo(User, {
  foreignKey: 'assignedTo',
  as: 'assignee',
});

// User <-> Task (Created By)
User.hasMany(Task, {
  foreignKey: 'createdBy',
  as: 'createdTasks',
  onDelete: 'RESTRICT',
});

Task.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator',
});

// User <-> TeamMember
User.hasMany(TeamMember, {
  foreignKey: 'userId',
  as: 'teamMemberships',
  onDelete: 'CASCADE',
});

TeamMember.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// User <-> Report
User.hasMany(Report, {
  foreignKey: 'userId',
  as: 'reports',
  onDelete: 'RESTRICT',
});

Report.belongsTo(User, {
  foreignKey: 'userId',
  as: 'author',
});

// User <-> Photo
User.hasMany(Photo, {
  foreignKey: 'userId',
  as: 'photos',
  onDelete: 'RESTRICT',
});

Photo.belongsTo(User, {
  foreignKey: 'userId',
  as: 'photographer',
});

// User <-> Notification
User.hasMany(Notification, {
  foreignKey: 'userId',
  as: 'notifications',
  onDelete: 'CASCADE',
});

Notification.belongsTo(User, {
  foreignKey: 'userId',
  as: 'recipient',
});

// User <-> Attendance
User.hasMany(Attendance, {
  foreignKey: 'userId',
  as: 'attendances',
  onDelete: 'CASCADE',
});

Attendance.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// ==================== PROJECT ====================

// Project <-> Task
Project.hasMany(Task, {
  foreignKey: 'projectId',
  as: 'tasks',
  onDelete: 'CASCADE',
});

Task.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project',
});

// Project <-> Team
Project.hasMany(Team, {
  foreignKey: 'projectId',
  as: 'teams',
  onDelete: 'CASCADE',
});

Team.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project',
});

// Project <-> Material
Project.hasMany(Material, {
  foreignKey: 'projectId',
  as: 'materials',
  onDelete: 'CASCADE',
});

Material.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project',
});

// Project <-> Report
Project.hasMany(Report, {
  foreignKey: 'projectId',
  as: 'reports',
  onDelete: 'CASCADE',
});

Report.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project',
});

// Project <-> Alert
Project.hasMany(Alert, {
  foreignKey: 'projectId',
  as: 'alerts',
  onDelete: 'CASCADE',
});

Alert.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project',
});

// Project <-> Attendance
Project.hasMany(Attendance, {
  foreignKey: 'projectId',
  as: 'attendances',
  onDelete: 'CASCADE',
});

Attendance.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project',
});

// ==================== TEAM ====================

// Team <-> TeamMember
Team.hasMany(TeamMember, {
  foreignKey: 'teamId',
  as: 'members',
  onDelete: 'CASCADE',
});

TeamMember.belongsTo(Team, {
  foreignKey: 'teamId',
  as: 'team',
});

// ==================== TASK ====================

// Task <-> Photo
Task.hasMany(Photo, {
  foreignKey: 'taskId',
  as: 'photos',
  onDelete: 'CASCADE',
});

Photo.belongsTo(Task, {
  foreignKey: 'taskId',
  as: 'task',
});

// ==================== REPORT ====================

// Report <-> Photo
Report.hasMany(Photo, {
  foreignKey: 'reportId',
  as: 'photos',
  onDelete: 'CASCADE',
});

Photo.belongsTo(Report, {
  foreignKey: 'reportId',
  as: 'report',
});

// ============================================
// EXPORT DE TOUS LES MODÈLES
// ============================================

module.exports = {
  sequelize,
  User,
  Project,
  Task,
  Team,
  TeamMember,
  Material,
  Report,
  Photo,
  Notification,
  Alert,
  Attendance,
};