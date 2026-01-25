const { File, Project, Task } = require('../models');
const AppError = require('../utils/AppError');

async function uploadFile(data, file, user) {
  if (!file) {
    throw new AppError('File is required', 400);
  }

  const project = await Project.findByPk(data.projectId);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  // Worker must belong to the project
  if (
    user.role === 'WORKER' &&
    project.managerId !== user.managerId &&
    project.bossId !== user.bossId
  ) {
    throw new AppError('Access denied', 403);
  }

  return File.create({
    url: `/uploads/${file.filename}`,
    type: data.type,
    projectId: data.projectId,
    taskId: data.taskId || null,
    uploadedBy: user.id,
  });
}

async function getProjectFiles(projectId) {
  return File.findAll({
    where: { projectId },
    order: [['createdAt', 'DESC']],
  });
}

async function deleteFile(id) {
  const file = await File.findByPk(id);
  if (!file) {
    throw new AppError('File not found', 404);
  }

  await file.destroy();
}

module.exports = {
  uploadFile,
  getProjectFiles,
  deleteFile,
};