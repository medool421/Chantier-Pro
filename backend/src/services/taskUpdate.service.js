const { TaskUpdate, Task, Project, User } = require('../models');
const AppError = require('../utils/AppError');
const cloudinary = require('../config/cloudinary');

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

async function findTaskInCompany(taskId, companyId) {
  const task = await Task.findByPk(taskId, {
    include: [
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'companyId'],
      },
    ],
  });

  if (!task || !task.project || task.project.companyId !== companyId) {
    throw new AppError('Task not found', 404);
  }

  return task;
}

async function createTaskUpdate(data, file, user) {
  const { taskId, type, message } = data;

  await findTaskInCompany(taskId, user.companyId);

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
  await findTaskInCompany(taskId, user.companyId);

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
