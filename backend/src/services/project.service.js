const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');
const TeamMember = require('../models/TeamMember');
const AppError = require('../utils/AppError');

const { Op } = require('sequelize');

async function createProject(data, bossId, companyId) {
  return Project.create({
    ...data,
    bossId,
    companyId,
  });
}

async function getAllProjects(userId, filters = {}) {
  const where = {
    [Op.or]: [
      { bossId: userId },
      { managerId: userId }
    ]
  };

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

async function getProjectById(id, userId) {
  const project = await Project.findOne({
    where: {
      id,
      [Op.or]: [
        { bossId: userId },
        { managerId: userId }
      ]
    },
    include: [
      { model: User, as: 'manager', attributes: ['id', 'firstName', 'lastName'] },
      { model: User, as: 'boss', attributes: ['id', 'firstName', 'lastName'] }
    ]
  });

  if (!project) {
    throw new AppError('Project not found or access denied', 404);
  }

  // ADD THIS
  const progress = await calculateProgress(project.id);

  return {
    ...project.toJSON(),
    progressPercentage: progress,
  };
}


async function updateProject(id, data, userId) {
  const project = await getProjectById(id, userId);
  await project.update(data);
  return project;
}

async function updateStatus(id, status, userId) {
  const project = await Project.findOne({
    where: {
      id,
      [Op.or]: [
        { bossId: userId },
        { managerId: userId }
      ]
    }
  });

  if (!project) {
    throw new AppError('Project not found or access denied', 404);
  }

  project.status = status;
  await project.save();

  // return the full enriched object via getProjectById
  return getProjectById(id, userId);
}

async function deleteProject(id, bossId) {
  const project = await Project.findOne({
    where: { id, bossId },
  });

  if (!project) {
    throw new AppError('Project not found or not authorized', 404);
  }

  await project.destroy();
}

async function assignManager(projectId, managerId, bossId) {
  const project = await Project.findOne({
    where: { id: projectId, bossId },
  });

  if (!project) {
    throw new AppError('Project not found or not authorized', 404);
  }

  const manager = await User.findOne({
    where: {
      id: managerId,
      role: 'MANAGER',
      isActive: true,
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


async function getProjectByManager(managerId) {
  const projects = await Project.findAll({
    where: { managerId },
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