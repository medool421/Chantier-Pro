const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');
const TeamMember = require('../models/TeamMember');
const AppError = require('../utils/AppError');
const { Op } = require('sequelize');

const {
  findAuthorizedProject,
  projectAccessWhere,
} = require('../utils/projectAccess');

async function createProject(data, bossId, companyId) {
  return Project.create({
    ...data,
    bossId,
    companyId,
  });
}

async function getAllProjects(user, filters = {}) {
  const where = projectAccessWhere(user);

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.search) {
    where.name = { [Op.like]: `%${filters.search}%` };
  }

  return Project.findAll({
    where,
    order: [['createdAt', 'DESC']],
    include: [
      { model: User, as: 'manager', attributes: ['id', 'firstName', 'lastName'] },
      { model: User, as: 'boss', attributes: ['id', 'firstName', 'lastName'] }
    ]
  });
}

async function getProjectById(id, user) {
  const project = await findAuthorizedProject(id, user, {
    include: [
      { model: User, as: 'manager', attributes: ['id', 'firstName', 'lastName'] },
      { model: User, as: 'boss', attributes: ['id', 'firstName', 'lastName'] }
    ]
  });

  // ADD THIS
  const progress = await calculateProgress(project.id);

  return {
    ...project.toJSON(),
    progressPercentage: progress,
  };
}


async function updateProject(id, data, user) {
  const project = await findAuthorizedProject(id, user);
  await project.update(data);
  return getProjectById(id, user);
}

async function updateStatus(id, status, user) {
  const project = await findAuthorizedProject(id, user);
  project.status = status;
  await project.save();

  // return the full enriched object via getProjectById
  return getProjectById(id, user);
}

async function deleteProject(id, user) {
  const project = await findAuthorizedProject(id, user);
  await project.destroy();
}

async function assignManager(projectId, managerId, bossUser) {
  const project = await findAuthorizedProject(projectId, bossUser);

  const manager = await User.findOne({
    where: {
      id: managerId,
      role: 'MANAGER',
      isActive: true,
      status: 'ACTIVE',
      companyId: bossUser.companyId,
    },
  });

  if (!manager) {
    throw new AppError('Invalid manager', 400);
  }

  project.managerId = managerId;
  await project.save();

  return project;
}

async function getManagers(companyId) { 
  return User.findAll({
    where: {
      role: 'MANAGER',
      isActive: true,
      status: 'ACTIVE',
      companyId,
    },
    attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
  });
}

async function getWorkers(companyId) {
  return User.findAll({
    where: {
      role: 'WORKER',
      isActive: true,
      status: 'ACTIVE',
      companyId,
    },
    attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
    order: [['firstName', 'ASC']],
  });
}

async function calculateProgress(projectId) {
  const totalTasks = await Task.count({ where: { projectId } });

  if (totalTasks === 0) return 0;

  const completedTasks = await Task.count({
    where: {
      projectId,
      status: 'COMPLETED',
    },
  });

  return Math.round((completedTasks / totalTasks) * 100);
}


async function getProjectByManager(user) {
  const projects = await Project.findAll({
    where: {
      ...projectAccessWhere(user),
      managerId: user.id,
    },
    include: [
      {
        model: User,
        as: 'manager',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  const projectsWithProgress = await Promise.all(
    projects.map(async (project) => {
      const progress = await calculateProgress(project.id);
      return {
        ...project.toJSON(),
        progressPercentage: progress,
      };
    })
  );

  return projectsWithProgress;
}



module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  updateStatus,
  deleteProject,
  assignManager,
  getManagers,
  getWorkers,
  calculateProgress,
  getProjectByManager,
};
