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
Project.hasOne(Team, { as: 'team', foreignKey: 'projectId' });  
Team.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });  

// Team ↔ TeamMember ↔ User
Team.hasMany(TeamMember, { as: 'members', foreignKey: 'teamId' });  
TeamMember.belongsTo(Team, { as: 'team', foreignKey: 'teamId' });  

User.hasMany(TeamMember, { as: 'teamMemberships', foreignKey: 'userId' });  
TeamMember.belongsTo(User, { as: 'user', foreignKey: 'userId' });  

// Project ↔ Task
Project.hasMany(Task, { as: 'tasks', foreignKey: 'projectId' });  
Task.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });  

// User ↔ Task
User.hasMany(Task, { as: 'assignedTasks', foreignKey: 'assignedTo' });
Task.belongsTo(User, { as: 'assignee', foreignKey: 'assignedTo' });

User.hasMany(Task, { as: 'createdTasks', foreignKey: 'createdBy' });
Task.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

// Task ↔ File
Task.hasMany(File, { as: 'files', foreignKey: 'taskId' });  
File.belongsTo(Task, { as: 'task', foreignKey: 'taskId' });  

// Report ↔ File
Report.hasMany(File, { as: 'files', foreignKey: 'reportId' });  
File.belongsTo(Report, { as: 'report', foreignKey: 'reportId' });  

// Project ↔ Report
Project.hasMany(Report, { as: 'reports', foreignKey: 'projectId' });  
Report.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });  

// User ↔ Report
User.hasMany(Report, { as: 'reports', foreignKey: 'userId' });  
Report.belongsTo(User, { as: 'user', foreignKey: 'userId' });  

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