const express = require('express');
const router = express.Router();

const fileController = require('../controllers/file.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const upload = require('../config/multer');

const { uploadFileSchema } = require('../validators/file.validator');

/**
 * @swagger
 * tags:
 *   name: Files
 *   description: File upload and management
 */

router.use(auth);

/**
 * @swagger
 * /api/files:
 *   post:
 *     summary: Upload a file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - projectId
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               projectId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: File uploaded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FileResponse'
 */
router.post(
  '/',
  role('WORKER', 'MANAGER'),
  upload.single('file'),
  validate(uploadFileSchema),
  fileController.uploadFile
);

/**
 * @swagger
 * /api/files/projects/{projectId}:
 *   get:
 *     summary: Get files for a project
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Project files
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FileListResponse'
 */
router.get(
  '/projects/:projectId',
  role('BOSS', 'MANAGER'),
  fileController.getProjectFiles
);

/**
 * @swagger
 * /api/files/{id}:
 *   delete:
 *     summary: Delete a file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: File deleted
 */
router.delete(
  '/:id',
  role('MANAGER'),
  fileController.deleteFile
);

module.exports = router;