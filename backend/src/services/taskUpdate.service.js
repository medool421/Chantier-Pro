const { TaskUpdate, Task, TaskAssignment, Project, User } = require('../models');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { sequelize } = require('../config/database');
const AppError = require('../utils/AppError');
const cloudinary = require('../config/cloudinary');
const { uploadDir, resolveStoredPath, removeStoredFile, detectMimeType } = require('../utils/fileStorage');
const { assertAuthorizedProject } = require('../utils/projectAccess');
const { notifyTaskStatusChanged } = require('./notification.service');

const imageExtensions = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/bmp': '.bmp',
  'image/tiff': '.tiff',
  'image/webp': '.webp',
  'image/heic': '.heic',
};

function validateTaskUpdateImage(file) {
  if (!file || !Buffer.isBuffer(file.buffer)) {
    throw new AppError('Invalid task update photo', 400);
  }

  const detectedMimeType = detectMimeType(file.buffer);
  const declaredMimeType = (file.mimetype || '').toLowerCase();
  const compatibleJpeg = detectedMimeType === 'image/jpeg'
    && ['image/jpeg', 'image/jpg', 'image/pjpeg'].includes(declaredMimeType);
  const compatibleHeic = detectedMimeType === 'image/heic'
    && ['image/heic', 'image/heif'].includes(declaredMimeType);

  if (!imageExtensions[detectedMimeType] || (!compatibleJpeg && !compatibleHeic && detectedMimeType !== declaredMimeType)) {
    throw new AppError('File content does not match its declared image type', 400);
  }

  return detectedMimeType;
}

async function saveTaskUpdateImageLocally(file, mimeType) {
  await fs.mkdir(uploadDir, { recursive: true });
  const filename = `task-update-${crypto.randomUUID()}${imageExtensions[mimeType]}`;
  const filePath = path.join(uploadDir, filename);
  await fs.writeFile(filePath, file.buffer, { flag: 'wx' });
  return { imageUrl: `/uploads/${filename}`, localPath: filePath };
}

async function isAssignedTo(task, userId) {
  if (task.assignedTo === userId || (task.assignees || []).some((assignee) => assignee.id === userId)) {
    return true;
  }

  return Boolean(await TaskAssignment.findOne({ where: { taskId: task.id, userId } }));
}

async function uploadTaskUpdateImage(file) {
  const mimeType = validateTaskUpdateImage(file);
  const hasCloudinaryCredentials = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME
    && process.env.CLOUDINARY_API_KEY
    && process.env.CLOUDINARY_API_SECRET
  );

  if (hasCloudinaryCredentials) {
    try {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'chantierpro/task-updates',
            resource_type: 'image',
          },
          (error, uploadResult) => {
            if (error) return reject(error);
            if (!uploadResult?.secure_url) return reject(new Error('Cloudinary returned no image URL'));
            resolve(uploadResult);
          }
        );
        uploadStream.once('error', reject);
        uploadStream.end(file.buffer);
      });
      return { imageUrl: result.secure_url, localPath: null };
    } catch (error) {
      console.warn('Cloudinary task update upload failed; storing photo locally:', error.message);
    }
  }

  return saveTaskUpdateImageLocally(file, mimeType);
}

async function findAuthorizedTask(taskId, user) {
  const task = await Task.findByPk(taskId, {
    include: [
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'companyId', 'managerId', 'bossId'],
      },
      { model: User, as: 'assignees', attributes: ['id'], through: { attributes: [] } },
    ],
  });

  if (!task || !task.project) {
    throw new AppError('Task not found', 404);
  }

  if (user.role === 'WORKER') {
    const assigned = await isAssignedTo(task, user.id);
    const companyMismatch = user.companyId && task.project.companyId && user.companyId !== task.project.companyId;
    if (companyMismatch) {
      throw new AppError('Task not found', 404);
    }
    if (!assigned) {
      throw new AppError('You can only access updates for your own tasks', 403);
    }
  } else {
    assertAuthorizedProject(task.project, user);
  }

  return task;
}

async function createTaskUpdate(data, file, user) {
  const { taskId, type, message } = data;

  if (!user || user.role !== 'WORKER') {
    throw new AppError('Only Workers can create task updates', 403);
  }

  const task = await findAuthorizedTask(taskId, user);
  const taskCompanyId = task.project.companyId || user.companyId;
  if (!taskCompanyId) {
    throw new AppError('Task not found', 404);
  }

  if (type === 'BLOCKED' && !file) {
    throw new AppError('Image is required', 400);
  }

  let imageUrl = '';
  let localPath = null;
  if (file) {
    const uploadResult = await uploadTaskUpdateImage(file);
    imageUrl = uploadResult.imageUrl;
    localPath = uploadResult.localPath;
  }

  try {
    const taskUpdate = await sequelize.transaction(async (transaction) => {
      const update = await TaskUpdate.create({
        taskId,
        userId: user.id,
        companyId: taskCompanyId,
        type,
        message,
        imageUrl,
      }, { transaction });

      if (type === 'BLOCKED') {
        await task.update({ status: 'BLOCKED' }, { transaction });
      }

      return TaskUpdate.findByPk(update.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName'],
          },
        ],
        transaction,
      });
    });

    if (task.project.managerId) {
      await notifyTaskStatusChanged({
        managerId: task.project.managerId,
        workerFirstName: taskUpdate.user?.firstName || '',
        workerLastName: taskUpdate.user?.lastName || '',
        taskTitle: task.title,
        updateType: type,
        taskId: task.id,
        projectId: task.project.id,
      });
    }

    return taskUpdate;
  } catch (error) {
    if (localPath) await removeStoredFile(localPath).catch(() => {});
    throw error;
  }
}

async function getTaskUpdatesByTask(taskId, user) {
  const task = await findAuthorizedTask(taskId, user);
  const taskCompanyId = task.project.companyId || user.companyId;

  const where = { taskId };
  if (taskCompanyId) where.companyId = taskCompanyId;

  return TaskUpdate.findAll({
    where,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName'],
      },
    ],
    order: [['createdAt', 'DESC']],
  });
}

async function getTaskUpdatePhoto(updateId, user) {
  const update = await TaskUpdate.findByPk(updateId);
  if (!update || !update.imageUrl?.startsWith('/uploads/')) {
    throw new AppError('Task update photo not found', 404);
  }

  await findAuthorizedTask(update.taskId, user);
  const filePath = resolveStoredPath(update.imageUrl);
  if (!filePath) throw new AppError('Task update photo not found', 404);

  try {
    await fs.access(filePath);
  } catch (error) {
    if (error.code === 'ENOENT') throw new AppError('Task update photo not found', 404);
    throw error;
  }

  return filePath;
}

module.exports = {
  createTaskUpdate,
  getTaskUpdatesByTask,
  getTaskUpdatePhoto,
};
