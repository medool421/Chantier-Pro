const Project = require('../models/Project');
const AppError = require('../utils/AppError');
const User =require('../models/User') ;
const Task = require('../models/Task');
const { Op } =require('sequelize');

  async function createProject(data, bossId) {
    return Project.create({
      ...data,
      bossId,
    });
  }

  async function getAllProjects(bossId, filters = {}) {
    const where = { bossId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.name = { [Op.like]: `%${filters.search}%` };
    }

    return Project.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
  }

  async function getProjectById(id, bossId) {
    const project = await Project.findOne({
      where: { id, bossId },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    return project;
  }

  async function updateProject(id, data, bossId) {
    const project = await getProjectById(id, bossId);

    await project.update(data);
    return project;
  }

  async function updateStatus(id, status, bossId) {
    const project = await getProjectById(id, bossId);

    project.status = status;
    await project.save();

    return project;
  }

  async function deleteProject(id, bossId) {
    const project = await getProjectById(id, bossId);
    await project.destroy();
  }

 

async function assignManager(projectId, managerId, bossId) {
  const project = await Project.findOne({
    where: { id: projectId, bossId },
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  const manager = await User.findOne({
    where: { id: managerId, role: 'MANAGER', isActive: true },
  });

  if (!manager) {
    throw new AppError('Invalid manager', 400);
  }

  project.managerId = managerId;
  await project.save();

  return project;
    }


  async function calculateProgress(projectId) {
  const tasks = await Task.findAll({
    where: { projectId },
  });

  if (tasks.length === 0) return 0;

  const total = tasks.reduce(
    (sum, task) => sum + Number(task.progressPercentage || 0),
    0
  );

  return Number((total / tasks.length).toFixed(2));
    }


module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  updateStatus,
  deleteProject,
  assignManager,
  calculateProgress,
};