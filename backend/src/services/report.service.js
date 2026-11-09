const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { Report, Project, User } = require('../models');
const AppError = require('../utils/AppError');
const cloudinary = require('../config/cloudinary');
const { uploadDir, resolveStoredPath, detectMimeType } = require('../utils/fileStorage');
const { findAuthorizedProject } = require('../utils/projectAccess');

const imageExtensions = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/bmp': '.bmp',
  'image/tiff': '.tiff',
  'image/webp': '.webp',
  'image/heic': '.heic',
};

function validateReportImage(file) {
  if (!file || !Buffer.isBuffer(file.buffer)) {
    throw new AppError('Invalid report photo', 400);
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

async function saveReportImageLocally(file, mimeType) {
  await fs.mkdir(uploadDir, { recursive: true });
  const filename = `report-${crypto.randomUUID()}${imageExtensions[mimeType]}`;
  const filePath = path.join(uploadDir, filename);
  await fs.writeFile(filePath, file.buffer, { flag: 'wx' });
  return { imageUrl: `/uploads/${filename}`, localPath: filePath };
}

async function uploadReportImage(file) {
  const mimeType = validateReportImage(file);
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
            folder: 'chantierpro/reports',
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
      console.warn('Cloudinary report upload failed; storing photo locally:', error.message);
    }
  }

  return saveReportImageLocally(file, mimeType);
}

async function createReport(projectId, data, fileOrUser, maybeUser) {
  const file = maybeUser ? fileOrUser : null;
  const user = maybeUser || fileOrUser;

  await findAuthorizedProject(projectId, user);

  let imageUrl = data?.imageUrl || null;
  if (file) {
    const uploadResult = await uploadReportImage(file);
    imageUrl = uploadResult.imageUrl;
  }

  return Report.create({
    type: data.type,
    title: data.title,
    content: data.content,
    reportDate: data.reportDate,
    imageUrl,
    projectId,
    userId: user.id,
  });
}

async function getProjectReports(projectId, user) {
  await findAuthorizedProject(projectId, user);

  return Report.findAll({
    where: { projectId },
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

async function getReportById(id, user) {
  const report = await Report.findByPk(id, {
    include: [
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'name'],
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName'],
      },
    ],
  });

  if (!report) {
    throw new AppError('Report not found', 404);
  }

  await findAuthorizedProject(report.projectId, user);

  return report;
}

async function getReportPhoto(reportId, user) {
  const report = await Report.findByPk(reportId);
  if (!report || !report.imageUrl?.startsWith('/uploads/')) {
    throw new AppError('Report photo not found', 404);
  }

  await findAuthorizedProject(report.projectId, user);
  const filePath = resolveStoredPath(report.imageUrl);
  if (!filePath) throw new AppError('Report photo not found', 404);

  try {
    await fs.access(filePath);
  } catch (error) {
    if (error.code === 'ENOENT') throw new AppError('Report photo not found', 404);
    throw error;
  }

  return filePath;
}

module.exports = {
  createReport,
  getProjectReports,
  getReportById,
  getReportPhoto,
};
