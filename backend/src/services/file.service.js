const fs = require('fs');
const { File, Project, Task, User } = require('../models');
const AppError = require('../utils/AppError');
const {
  resolveStoredPath,
  removeStoredFile,
  validateFileContent,
} = require('../utils/fileStorage');
const {
  assertAuthorizedProject,
  findAuthorizedProject,
} = require('../utils/projectAccess');

const uploaderInclude = {
  model: User,
  as: 'uploader',
  attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
};

const LEGACY_CATEGORY_MAP = {
  BEFORE: 'UPDATES',
  AFTER: 'UPDATES',
  ISSUE: 'OTHER',
};

function addDisplayCategory(file) {
  const type = file.getDataValue('type');
  file.setDataValue('category', LEGACY_CATEGORY_MAP[type] || type || 'OTHER');
  return file;
}

function assertProjectAccess(project, user) {
  if (user.role === 'WORKER') {
    if (!project || !project.companyId || project.companyId !== user.companyId) {
      throw new AppError('Project not found', 404);
    }
    return;
  }

  assertAuthorizedProject(project, user);
}

function assertFileProjectAccess(project, task, user) {
  if (user.role === 'WORKER' && (!task || task.assignedTo !== user.id)) {
    throw new AppError('Task not found', 404);
  }

  assertProjectAccess(project, user);
}

async function getFileRecord(id, user) {
  const file = await File.findByPk(id, {
    include: [
      uploaderInclude,
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'companyId', 'bossId', 'managerId'],
      },
      {
        model: Task,
        as: 'task',
        attributes: ['id', 'projectId', 'assignedTo'],
      },
    ],
  });

  if (!file) {
    throw new AppError('File not found', 404);
  }

  assertFileProjectAccess(file.project, file.task, user);
  return addDisplayCategory(file);
}

async function uploadFile(data, file, user) {
  if (!user || !['BOSS', 'MANAGER', 'WORKER'].includes(user.role)) {
    throw new AppError('Forbidden: insufficient permissions', 403);
  }

  if (user.role === 'WORKER' && !data.taskId) {
    throw new AppError('Workers can only upload files to assigned tasks', 403);
  }

  if (user.role !== 'WORKER' && data.taskId) {
    throw new AppError('Shared project files cannot be attached to a task', 400);
  }

  if (!file) {
    throw new AppError('File is required', 400);
  }

  try {
    const detectedMimeType = await validateFileContent(file);

    const project = await Project.findByPk(data.projectId);
    if (!project) throw new AppError('Project not found', 404);

    // Workers may upload only to an assigned task in their company.
    assertProjectAccess(project, user);

    if (data.taskId) {
      const task = await Task.findOne({
        where: { id: data.taskId, projectId: data.projectId },
      });
      if (!task) throw new AppError('Task not found', 404);
      if (user.role === 'WORKER' && task.assignedTo !== user.id) {
        throw new AppError('You can only upload files to your own tasks', 403);
      }
    }

    const createdFile = await File.create({
      url: `/uploads/${file.filename}`,
      originalName: file.originalname,
      // Persist the verified MIME type so authenticated downloads advertise
      // the actual content type even when Android sends image/jpg or a
      // gallery URI with incomplete metadata.
      mimeType: detectedMimeType,
      size: file.size,
      type: data.type,
      projectId: data.projectId,
      taskId: data.taskId || null,
      uploadedBy: user.id,
    });

    return getFileRecord(createdFile.id, user);
  } catch (error) {
    if (file.path) {
      await removeStoredFile(file.path).catch(() => {});
    }
    throw error;
  }
}

async function getProjectFiles(projectId, user) {
  await findAuthorizedProject(projectId, user);

  const files = await File.findAll({
    where: { projectId },
    include: [uploaderInclude],
    order: [['createdAt', 'DESC']],
  });
  return files.map(addDisplayCategory);
}

async function getFileById(id, user) {
  return getFileRecord(id, user);
}

async function getFileDownload(id, user) {
  const file = await getFileRecord(id, user);
  const filePath = resolveStoredPath(file.url);

  if (!filePath) {
    throw new AppError('Stored file path is invalid', 500);
  }

  try {
    await fs.promises.access(filePath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new AppError('File content not found', 404);
    }
    throw error;
  }

  return { file, filePath };
}

async function deleteFile(id, user) {
  if (!user || !['BOSS', 'MANAGER'].includes(user.role)) {
    throw new AppError('Forbidden: insufficient permissions', 403);
  }

  const file = await getFileRecord(id, user);

  if (file.taskId) {
    throw new AppError('Task evidence cannot be deleted as a shared project file', 403);
  }

  const filePath = resolveStoredPath(file.url);
  if (!filePath) {
    throw new AppError('Stored file path is invalid', 500);
  }

  // Delete the database row first. If the database operation fails, the
  // physical file and its record remain recoverable and consistent.
  await file.destroy();

  try {
    await removeStoredFile(filePath);
  } catch (error) {
    console.error('File record deleted but physical cleanup failed:', error);
    throw new AppError('File record deleted but storage cleanup failed', 500);
  }
}

module.exports = {
  uploadFile,
  getProjectFiles,
  getFileById,
  getFileDownload,
  deleteFile,
};
