const { Op } = require('sequelize');
const { Task, TaskAssignment, User, Project, sequelize } = require('../models');
const AppError = require('../utils/AppError');
const {
  assertAuthorizedProject,
  findAuthorizedProject,
} = require('../utils/projectAccess');
const { notifyTaskAssigned } = require('./notification.service');

const assigneeAttributes = ['id', 'firstName', 'lastName', 'email', 'phone'];
const taskInclude = [
  { model: User, as: 'assignee', attributes: assigneeAttributes },
  { model: User, as: 'assignees', attributes: assigneeAttributes, through: { attributes: ['assignedAt', 'assignedBy'] } },
  { model: Project, as: 'project', attributes: ['id', 'name', 'status', 'description'] },
];

async function findTaskInCompany(taskId, user) {
  console.log('findTaskInCompany:', { taskId, userRole: user.role, userId: user.id, userCompany: user.companyId });
  const task = await Task.findByPk(taskId, {
    include: [
      { model: Project, as: 'project', attributes: ['id', 'name', 'status', 'description', 'companyId', 'managerId', 'bossId'] },
      { model: User, as: 'assignee', attributes: assigneeAttributes },
      { model: User, as: 'assignees', attributes: assigneeAttributes, through: { attributes: ['assignedAt', 'assignedBy'] } },
    ],
  });

  if (!task || !task.project) throw new AppError('Task not found', 404);

  if (user.role === 'WORKER') {
    const assigned = await isAssignedTo(task, user.id);
    const companyMismatch = user.companyId && task.project.companyId && user.companyId !== task.project.companyId;
    if (companyMismatch) {
      throw new AppError('Task not found', 404);
    }
    if (!assigned) {
      throw new AppError('You do not have permission to access this task', 403);
    }
  } else {
    assertAuthorizedProject(task.project, user);
  }

  return task;
}

async function isAssignedTo(task, userId) {
  if (task.assignedTo === userId || (task.assignees || []).some((assignee) => assignee.id === userId)) {
    return true;
  }

  return Boolean(await TaskAssignment.findOne({ where: { taskId: task.id, userId } }));
}

async function validateAssigneeIds(assigneeIds, companyId) {
  if (!Array.isArray(assigneeIds) || assigneeIds.some((id) => typeof id !== 'string')) {
    throw new AppError('assigneeIds must be an array of worker IDs', 400);
  }

  const uniqueIds = [...new Set(assigneeIds)];
  if (uniqueIds.length === 0) return uniqueIds;

  const workers = await User.findAll({
    where: {
      id: { [Op.in]: uniqueIds },
      companyId,
      role: 'WORKER',
      isActive: true,
      status: 'ACTIVE',
    },
    attributes: ['id'],
  });

  if (workers.length !== uniqueIds.length) {
    throw new AppError('One or more assignees are not active workers in your company', 404);
  }
  return uniqueIds;
}

async function syncTaskAssignees(task, assigneeIds, user, transaction) {
  const existing = await TaskAssignment.findAll({
    where: { taskId: task.id },
    attributes: ['userId'],
    transaction,
  });
  const nextIds = new Set(assigneeIds);
  const removedIds = existing.map((row) => row.userId).filter((id) => !nextIds.has(id));
  if (removedIds.length) {
    await TaskAssignment.destroy({ where: { taskId: task.id, userId: { [Op.in]: removedIds } }, transaction });
  }

  const existingIds = new Set(existing.map((row) => row.userId));
  const added = assigneeIds.filter((id) => !existingIds.has(id));
  if (added.length) {
    await TaskAssignment.bulkCreate(added.map((userId) => ({
      taskId: task.id,
      userId,
      assignedAt: new Date(),
      assignedBy: user.id,
    })), { transaction });
  }

  // Retain the original column as a compatibility mirror for older clients.
  task.assignedTo = assigneeIds[0] || null;
}

async function getTaskById(taskId, user) {
  return findTaskInCompany(taskId, user);
}

async function getProjectTasks(projectId, user) {
  await findAuthorizedProject(projectId, user);
  return Task.findAll({ where: { projectId }, include: taskInclude, order: [['createdAt', 'DESC']] });
}

async function getMyTasks(user) {
  const projectInclude = { ...taskInclude[2], required: true };
  if (user.companyId) {
    projectInclude.where = {
      [Op.or]: [
        { companyId: user.companyId },
        { companyId: null },
      ],
    };
  }

  return Task.findAll({
    where: {
      [Op.or]: [
        { assignedTo: user.id },
        { '$assignees.id$': user.id },
      ],
    },
    include: [
      taskInclude[0],
      taskInclude[1],
      projectInclude,
    ],
    distinct: true,
    order: [['dueDate', 'ASC'], ['priority', 'DESC'], ['createdAt', 'DESC']],
  });
}

async function createTask(projectId, taskData, user) {
  const project = await findAuthorizedProject(projectId, user);
  const hasAssigneeIds = Object.prototype.hasOwnProperty.call(taskData, 'assigneeIds');
  const legacyId = taskData.assignedTo || taskData.assigneeId;
  const assigneeIds = await validateAssigneeIds(
    hasAssigneeIds ? taskData.assigneeIds : (legacyId ? [legacyId] : []),
    project.companyId || user.companyId
  );
  const fields = { ...taskData };
  delete fields.assigneeIds;
  delete fields.assigneeId;
  delete fields.assignedTo;
  const task = await sequelize.transaction(async (transaction) => {
    const task = await Task.create({ ...fields, assignedTo: assigneeIds[0] || null, projectId }, { transaction });
    if (assigneeIds.length) await syncTaskAssignees(task, assigneeIds, user, transaction);
    return Task.findByPk(task.id, { include: taskInclude, transaction });
  });

  if (hasAssigneeIds) {
    await Promise.all(
      assigneeIds
        .filter((assigneeId) => assigneeId !== user.id)
        .map((assigneeId) => notifyTaskAssigned({
          assigneeId,
          taskTitle: task.title,
          projectName: task.project?.name || project.name,
          taskId: task.id,
          projectId: task.projectId,
        }))
    );
  }

  return task;
}

async function updateTask(taskId, updates, user) {
  const task = await findTaskInCompany(taskId, user);
  const hasAssigneeIds = Object.prototype.hasOwnProperty.call(updates, 'assigneeIds');
  const hasLegacyId = Object.prototype.hasOwnProperty.call(updates, 'assigneeId');
  const hasAssignedTo = Object.prototype.hasOwnProperty.call(updates, 'assignedTo');
  let assignedWorkerIds = [];

  const updatedTask = await sequelize.transaction(async (transaction) => {
    if (hasAssigneeIds || hasLegacyId || hasAssignedTo) {
      const requested = hasAssigneeIds
        ? updates.assigneeIds
        : ((updates.assigneeId || updates.assignedTo) ? [updates.assigneeId || updates.assignedTo] : []);
      assignedWorkerIds = await validateAssigneeIds(requested, task.project.companyId || user.companyId);
      await syncTaskAssignees(task, assignedWorkerIds, user, transaction);
    }

    for (const field of ['dueDate', 'title', 'description', 'priority', 'status']) {
      if (Object.prototype.hasOwnProperty.call(updates, field)) task[field] = updates[field];
    }
    await task.save({ transaction });
    return Task.findByPk(taskId, { include: taskInclude, transaction });
  });

  if (hasAssigneeIds) {
    await Promise.all(
      assignedWorkerIds
        .filter((assigneeId) => assigneeId !== user.id)
        .map((assigneeId) => notifyTaskAssigned({
          assigneeId,
          taskTitle: updatedTask.title,
          projectName: updatedTask.project?.name || task.project.name,
          taskId: updatedTask.id,
          projectId: updatedTask.projectId,
        }))
    );
  }

  return updatedTask;
}

async function updateTaskStatus(taskId, status, user) {
  const task = await findTaskInCompany(taskId, user);
  await task.update({ status });
  return Task.findByPk(taskId, { include: taskInclude });
}

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
