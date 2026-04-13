const { Task, User, Project } = require('../models');
const AppError = require('../utils/AppError');

// ─── Shared include for task responses ────────────────────────────────────
const taskInclude = [
  {
    model: User,
    as: 'assignee',
    attributes: ['id', 'firstName', 'lastName', 'email'],
  },
  {
    model: Project,
    as: 'project',
    attributes: ['id', 'name', 'status', 'description'],
  },
];

// ─── Helper: fetch task and verify it belongs to user's company ───────────
async function findTaskInCompany(taskId, companyId) {
  const task = await Task.findByPk(taskId, {
    include: [
      { model: Project, as: 'project', attributes: ['id', 'name', 'status', 'description', 'companyId'] },
      { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
  });

  if (!task || task.project.companyId !== companyId) {
    throw new AppError('Task not found', 404);
  }

  return task;
}

// ─── Get task by ID ────────────────────────────────────────────────────────
async function getTaskById(taskId, user) {
  const task = await findTaskInCompany(taskId, user.companyId);

  // WORKER can only view their own tasks
  if (user.role === 'WORKER' && task.assignedTo !== user.id) {
    throw new AppError('You do not have permission to view this task', 403);
  }

  return task;
}

// ─── Get all tasks for a project ──────────────────────────────────────────
async function getProjectTasks(projectId, user) {
  const project = await Project.findOne({
    where: { id: projectId, companyId: user.companyId },
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  return Task.findAll({
    where: { projectId },
    include: taskInclude,
    order: [['createdAt', 'DESC']],
  });
}

// ─── Get tasks assigned to current user ───────────────────────────────────
async function getMyTasks(userId) {
  return Task.findAll({
    where: { assignedTo: userId },
    include: taskInclude,
    order: [
      ['dueDate', 'ASC'],
      ['priority', 'DESC'],
      ['createdAt', 'DESC'],
    ],
  });
}

// ─── Create a task ────────────────────────────────────────────────────────
async function createTask(projectId, taskData, user) {
  // Verify project belongs to user's company
  const project = await Project.findOne({
    where: { id: projectId, companyId: user.companyId },
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  // Verify assignee belongs to the same company
  if (taskData.assignedTo) {
    const assignee = await User.findOne({
      where: { id: taskData.assignedTo, companyId: user.companyId },
    });

    if (!assignee) {
      throw new AppError('Assignee not found in your company', 404);
    }

    if (assignee.role !== 'WORKER') {
      throw new AppError('Tasks can only be assigned to WORKER role', 400);
    }
  }

  const task = await Task.create({ ...taskData, projectId });

  return Task.findByPk(task.id, { include: taskInclude });
}

// ─── Update a task ────────────────────────────────────────────────────────
async function updateTask(taskId, updates, user) {
  const task = await findTaskInCompany(taskId, user.companyId);

  // Verify new assignee belongs to the same company
  if ('assigneeId' in updates) {
    if (updates.assigneeId === null) {
      task.assignedTo = null;
    } else {
      const assignee = await User.findOne({
        where: { id: updates.assigneeId, companyId: user.companyId },
      });

      if (!assignee) {
        throw new AppError('Assignee not found in your company', 404);
      }

      if (assignee.role !== 'WORKER') {
        throw new AppError('Tasks can only be assigned to WORKER role', 400);
      }

      task.assignedTo = updates.assigneeId;
    }
  }

  if ('dueDate' in updates) task.dueDate = updates.dueDate;
  if ('title' in updates) task.title = updates.title;
  if ('description' in updates) task.description = updates.description;
  if ('priority' in updates) task.priority = updates.priority;
  if ('status' in updates) task.status = updates.status;

  await task.save();

  return Task.findByPk(taskId, { include: taskInclude });
}

// ─── Update task status ───────────────────────────────────────────────────
async function updateTaskStatus(taskId, status, user) {
  const task = await findTaskInCompany(taskId, user.companyId);

  if (user.role === 'WORKER' && task.assignedTo !== user.id) {
    throw new AppError('You can only update your own tasks', 403);
  }

  await task.update({ status });

  return Task.findByPk(taskId, { include: taskInclude });
}

// ─── Delete a task ────────────────────────────────────────────────────────
async function deleteTask(taskId, user) {
  const task = await findTaskInCompany(taskId, user.companyId);
  await task.destroy();
  return true;
}

module.exports = {
  getTaskById,
  getProjectTasks,
  getMyTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
};