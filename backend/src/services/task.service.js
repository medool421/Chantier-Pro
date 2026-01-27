const { Task, User, Project } = require('../models');
const AppError = require('../utils/AppError');

//  Get task by ID with permission check
async function getTaskById(taskId, user) {
  const task = await Task.findByPk(taskId, {
    include: [
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
    ],
  });

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  // Permission check: WORKER can only view their own tasks
  if (user.role === 'WORKER' && task.assignedTo !== user.id) {
    throw new AppError('You do not have permission to view this task', 403);
  }

  return task;
}

/**
 * Get all tasks for a specific project
 */
async function getProjectTasks(projectId, user) {
  const project = await Project.findByPk(projectId);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  return Task.findAll({
    where: { projectId },
    include: [
      {
        model: User,
        as: 'assignee',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'name', 'status'],
      },
    ],
    order: [['createdAt', 'DESC']],
  });
}

//  Get tasks assigned to a specific user

async function getMyTasks(userId) {
  return Task.findAll({
    where: { assignedTo: userId },
    include: [
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
    ],
    order: [
      ['dueDate', 'ASC'],
      ['priority', 'DESC'],
      ['createdAt', 'DESC'],
    ],
  });
}

  // Create a new task

async function createTask(projectId, taskData) {
  const project = await Project.findByPk(projectId);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (taskData.assignedTo) {
    const assignee = await User.findByPk(taskData.assignedTo);
    if (!assignee) {
      throw new AppError('Assignee user not found', 404);
    }
    if (assignee.role !== 'WORKER') {
      throw new AppError('Tasks can only be assigned to WORKER role', 400);
    }
  }

  const task = await Task.create({
    ...taskData,
    projectId,
  });

  return Task.findByPk(task.id, {
    include: [
      {
        model: User,
        as: 'assignee',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'name', 'status'],
      },
    ],
  });
}

  // Update a task

async function updateTask(taskId, updates) {
  const task = await Task.findByPk(taskId);

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  // ASSIGNEE CHECK
  if ('assigneeId' in updates) {
    if (updates.assigneeId === null) {
      task.assigneeId = null;
    } else {
      const assignee = await User.findByPk(updates.assigneeId);

      if (!assignee) {
        throw new AppError('Assignee user not found', 404);
      }

      if (assignee.role !== 'WORKER') {
        throw new AppError('Tasks can only be assigned to WORKER role', 400);
      }

      task.assigneeId = updates.assigneeId;
      task.assignedTo = updates.assigneeId;
    }
  }

  // DUE DATE
  if ('dueDate' in updates) {
    task.dueDate = updates.dueDate;
  }

  // ALLOWED DIRECT FIELDS
  if ('title' in updates) task.title = updates.title;
  if ('description' in updates) task.description = updates.description;
  if ('priority' in updates) task.priority = updates.priority;
  if ('status' in updates) task.status = updates.status;

  await task.save();

  return Task.findByPk(taskId, {
    include: [
      {
        model: User,
        as: 'assignee',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'name', 'status'],
      },
    ],
  });
}



// Update task status with permission check
async function updateTaskStatus(taskId, status, user) {
  const task = await Task.findByPk(taskId);

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  if (user.role === 'WORKER' && task.assignedTo !== user.id) {
    throw new AppError('You can only update your own tasks', 403);
  }

  await task.update({ status });

  return Task.findByPk(taskId, {
    include: [
      {
        model: User,
        as: 'assignee',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'name', 'status'],
      },
    ],
  });
}


  // Delete a task

async function deleteTask(taskId) {
  const task = await Task.findByPk(taskId);

  if (!task) {
    throw new AppError('Task not found', 404);
  }

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