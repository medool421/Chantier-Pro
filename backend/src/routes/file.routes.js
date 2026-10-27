const express = require('express');
const router = express.Router();

const fileController = require('../controllers/file.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const upload = require('../config/multer');
const AppError = require('../utils/AppError');
const { removeStoredFile } = require('../utils/fileStorage');

const { uploadFileSchema } = require('../validators/file.validator');

async function cleanupUploadedFile(req) {
  if (!req.file || !req.file.path) return;

  try {
    await removeStoredFile(req.file.path);
  } catch (cleanupError) {
    console.error('Unable to clean up rejected upload:', cleanupError);
  }
}

/**
 * @swagger
 * tags:
 *   name: Files
 *   description: Project file upload and retrieval
 */

const parseUpload = (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    if (!error) return next();

    cleanupUploadedFile(req).finally(() => {
      const isClientUploadError = [
        'LIMIT_FILE_SIZE',
        'LIMIT_FILE_COUNT',
        'LIMIT_UNEXPECTED_FILE',
      ].includes(error.code) || error.message === 'Only image and PDF files are supported';

      if (!isClientUploadError) return next(error);

      const message = error.code === 'LIMIT_FILE_SIZE'
        ? 'File is too large (maximum 10 MB)'
        : error.message || 'Invalid file upload';

      return next(new AppError(message, 400));
    });
  });
};

const validateUpload = (req, res, next) => {
  validate(uploadFileSchema)(req, res, (error) => {
    if (!error) return next();

    cleanupUploadedFile(req).finally(() => next(error));
  });
};

router.use(auth);

// Workers may upload task evidence. Bosses and Managers may upload shared
// project files; the service enforces the distinction using taskId.
/**
 * @swagger
 * /api/files:
 *   post:
 *     summary: Upload a project file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  role('BOSS', 'MANAGER', 'WORKER'),
  parseUpload,
  validateUpload,
  fileController.uploadFile
);

/**
 * @swagger
 * /api/files/projects/{projectId}:
 *   get:
 *     summary: List files for an authorized project
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/projects/:projectId',
  role('BOSS', 'MANAGER'),
  fileController.getProjectFiles
);

/**
 * @swagger
 * /api/files/{id}/download:
 *   get:
 *     summary: Download an authorized project file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id/download',
  role('BOSS', 'MANAGER'),
  fileController.downloadFile
);

/**
 * @swagger
 * /api/files/{id}:
 *   get:
 *     summary: Retrieve authorized file metadata
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id',
  role('BOSS', 'MANAGER'),
  fileController.getFile
);

router.delete(
  '/:id',
  role('BOSS', 'MANAGER'),
  fileController.deleteFile
);

module.exports = router;
