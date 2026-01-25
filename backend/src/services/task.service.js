const { Task, Project, User } = require('../models');
const AppError = require('../utils/AppError');

async function createTask(projectId, data, managerId) {
  const project = await Project.findOne({
    where: { id: projectId, managerId },
  });

  if (!project) {
    throw new AppError('Project not found or access denied', 404);
  }

  const worker = await User.findOne({
    where: { id: data.assignedTo, role: 'WORKER', isActive: true },
  });

  if (!worker) {
    throw new AppError('Invalid worker', 400);
  }

  return Task.create({
    title: data.title,
    description: data.description,
    priority: data.priority,
    status: 'TODO',
    progressPercentage: 0,
    projectId,
    assignedTo: data.assignedTo,
    createdBy: managerId,
  });
}

async function getProjectTasks(projectId, user) {
  return Task.findAll({
    where: { projectId },
    include: [
      {
        model: User,
        as: 'assignee',
        attributes: ['id', 'firstName', 'lastName'],
      },
    ],
    order: [['createdAt', 'DESC']],
  });
}

async function getMyTasks(workerId) {
  return Task.findAll({
    where: { assignedTo: workerId },
    include: [
      {
        model: Project,
        attributes: ['id', 'name'],
      },
    ],
    order: [['createdAt', 'DESC']],
  });
}

async function updateTask(id, data, managerId) {
  const task = await Task.findByPk(id);

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  const project = await Project.findOne({
    where: { id: task.projectId, managerId },
  });

  if (!project) {
    throw new AppError('Access denied', 403);
  }

  await task.update(data);
  return task;
}

async function updateTaskStatus(id, status, user) {
  const task = await Task.findByPk(id);

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  if (
    user.role === 'WORKER' &&
    task.assignedTo !== user.id
  ) {
    throw new AppError('Access denied', 403);
  }

  task.status = status;

  if (status === 'COMPLETED') {
    task.progressPercentage = 100;
  } else if (status === 'IN_PROGRESS') {
    task.progressPercentage = 50;
  }

  await task.save();
  return task;
}

async function deleteTask(id, managerId) {
  const task = await Task.findByPk(id);

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  const project = await Project.findOne({
    where: { id: task.projectId, managerId },
  });

  if (!project) {
    throw new AppError('Access denied', 403);
  }

  await task.destroy();
}

module.exports = {
  createTask,
  getProjectTasks,
  getMyTasks,
  updateTask,
  updateTaskStatus,
  deleteTask,
};
