const { Task, User, Project } = require('../models');
const AppError = require('../utils/AppError');
const {
  assertAuthorizedProject,
  findAuthorizedProject,
} = require('../utils/projectAccess');

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
async function findTaskInCompany(taskId, user) {
  const task = await Task.findByPk(taskId, {
    include: [
      { model: Project, as: 'project', attributes: ['id', 'name', 'status', 'description', 'companyId', 'managerId', 'bossId'] },
      { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
  });

  if (!task || !task.project) {
    throw new AppError('Task not found', 404);
  }

  if (user.role === 'WORKER') {
    if (!task.project.companyId || task.project.companyId !== user.companyId) {
      throw new AppError('Task not found', 404);
    }
  } else {
    assertAuthorizedProject(task.project, user);
  }

  return task;
}

// ─── Get task by ID ────────────────────────────────────────────────────────
async function getTaskById(taskId, user) {
  const task = await findTaskInCompany(taskId, user);

  // WORKER can only view their own tasks
  if (user.role === 'WORKER' && task.assignedTo !== user.id) {
    throw new AppError('You do not have permission to view this task', 403);
  }

  return task;
}

// ─── Get all tasks for a project ──────────────────────────────────────────
async function getProjectTasks(projectId, user) {
  await findAuthorizedProject(projectId, user);

  return Task.findAll({
    where: { projectId },
    include: taskInclude,
    order: [['createdAt', 'DESC']],
  });
}

// ─── Get tasks assigned to current user ───────────────────────────────────
async function getMyTasks(user) {
  return Task.findAll({
    where: { assignedTo: user.id },
    include: [
      taskInclude[0],
      {
        ...taskInclude[1],
        where: { companyId: user.companyId },
        required: true,
      },
    ],
    order: [
      ['dueDate', 'ASC'],
      ['priority', 'DESC'],
      ['createdAt', 'DESC'],
    ],
  });
}

// ─── Create a task ────────────────────────────────────────────────────────
async function createTask(projectId, taskData, user) {
  const project = await findAuthorizedProject(projectId, user);

  // Verify assignee belongs to the same company and is active.
  if (taskData.assignedTo) {
    const assignee = await User.findOne({
      where: {
        id: taskData.assignedTo,
        companyId: project.companyId || user.companyId,
        role: 'WORKER',
        isActive: true,
        status: 'ACTIVE',
      },
    });

    if (!assignee) {
      throw new AppError('Assignee not found in your company', 404);
    }

  }

  const task = await Task.create({ ...taskData, projectId });

  return Task.findByPk(task.id, { include: taskInclude });
}

// ─── Update a task ────────────────────────────────────────────────────────
async function updateTask(taskId, updates, user) {
  const task = await findTaskInCompany(taskId, user);

  // Verify new assignee belongs to the same company and is active.
  if ('assigneeId' in updates) {
    if (updates.assigneeId === null) {
      task.assignedTo = null;
    } else {
      const assignee = await User.findOne({
        where: {
          id: updates.assigneeId,
          companyId: task.project.companyId || user.companyId,
          role: 'WORKER',
          isActive: true,
          status: 'ACTIVE',
        },
      });

      if (!assignee) {
        throw new AppError('Assignee not found in your company', 404);
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
  const task = await findTaskInCompany(taskId, user);

  if (user.role === 'WORKER' && task.assignedTo !== user.id) {
    throw new AppError('You can only update your own tasks', 403);
  }

  await task.update({ status });

  return Task.findByPk(taskId, { include: taskInclude });
}

// ─── Delete a task ────────────────────────────────────────────────────────
async function deleteTask(taskId, user) {
  const task = await findTaskInCompany(taskId, user);
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
