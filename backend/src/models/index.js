const {sequelize} = require('../config/database');

const User = require('./User');
const Project = require('./Project');
const Team = require('./Team');
const TeamMember = require('./TeamMember');
const Task = require('./Task');
const File = require('./File');
const Report = require('./Report');

/* ======================
   RELATIONSHIPS
====================== */

// User ↔ Project
User.hasMany(Project, { as: 'managedProjects', foreignKey: 'managerId' });
Project.belongsTo(User, { as: 'manager', foreignKey: 'managerId' });

User.hasMany(Project, { as: 'supervisedProjects', foreignKey: 'bossId' });
Project.belongsTo(User, { as: 'boss', foreignKey: 'bossId' });

// Project ↔ Team
Project.hasOne(Team, { foreignKey: 'projectId' });
Team.belongsTo(Project, { foreignKey: 'projectId' });

// Team ↔ TeamMember ↔ User
Team.hasMany(TeamMember, { foreignKey: 'teamId' });
TeamMember.belongsTo(Team, { foreignKey: 'teamId' });

User.hasMany(TeamMember, { foreignKey: 'userId' });
TeamMember.belongsTo(User, { foreignKey: 'userId' });

// Project ↔ Task
Project.hasMany(Task, { foreignKey: 'projectId' });
Task.belongsTo(Project, { foreignKey: 'projectId' });

// User ↔ Task
User.hasMany(Task, { as: 'assignedTasks', foreignKey: 'assignedTo' });
Task.belongsTo(User, { as: 'assignee', foreignKey: 'assignedTo' });

User.hasMany(Task, { as: 'createdTasks', foreignKey: 'createdBy' });
Task.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

// Task ↔ File
Task.hasMany(File, { foreignKey: 'taskId' });
File.belongsTo(Task, { foreignKey: 'taskId' });

// Report ↔ File
Report.hasMany(File, { foreignKey: 'reportId' });
File.belongsTo(Report, { foreignKey: 'reportId' });

// Project ↔ Report
Project.hasMany(Report, { foreignKey: 'projectId' });
Report.belongsTo(Project, { foreignKey: 'projectId' });

// User ↔ Report
User.hasMany(Report, { foreignKey: 'userId' });
Report.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  Project,
  Team,
  TeamMember,
  Task,
  File,
  Report,
};
