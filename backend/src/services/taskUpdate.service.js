const { TaskUpdate, Task, Project, User } = require('../models');
const AppError = require('../utils/AppError');
const cloudinary = require('../config/cloudinary');
const { assertAuthorizedProject } = require('../utils/projectAccess');

function uploadTaskUpdateImage(file) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'chantierpro/task-updates',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(file.buffer);
  });
}

async function findAuthorizedTask(taskId, user) {
  const task = await Task.findByPk(taskId, {
    include: [
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'companyId', 'managerId', 'bossId'],
      },
    ],
  });

  if (!task || !task.project) {
    throw new AppError('Task not found', 404);
  }

  if (user.role === 'WORKER') {
    if (!task.project.companyId || task.project.companyId !== user.companyId) {
      throw new AppError('Task not found', 404);
    }
    if (task.assignedTo !== user.id) {
      throw new AppError('You can only access updates for your own tasks', 403);
    }
  } else {
    assertAuthorizedProject(task.project, user);
  }

  return task;
}

async function createTaskUpdate(data, file, user) {
  const { taskId, type, message } = data;

  await findAuthorizedTask(taskId, user);

  if (!file) {
    throw new AppError('Image is required', 400);
  }

  const uploadResult = await uploadTaskUpdateImage(file);

  const update = await TaskUpdate.create({
    taskId,
    userId: user.id,
    companyId: user.companyId,
    type,
    message,
    imageUrl: uploadResult.secure_url,
  });

  return TaskUpdate.findByPk(update.id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName'],
      },
    ],
  });
}

async function getTaskUpdatesByTask(taskId, user) {
  await findAuthorizedTask(taskId, user);

  return TaskUpdate.findAll({
    where: {
      taskId,
      companyId: user.companyId,
    },
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

module.exports = {
  createTaskUpdate,
  getTaskUpdatesByTask,
};
