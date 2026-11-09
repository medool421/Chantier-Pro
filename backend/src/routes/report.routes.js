const express = require('express');
const multer = require('multer');
const router = express.Router();

const reportController = require('../controllers/report.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const AppError = require('../utils/AppError');

const {
  createReportSchema,
} = require('../validators/report.validator');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new AppError('Only image files are allowed', 400));
      return;
    }
    cb(null, true);
  },
});

const uploadFields = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
]);

const handleReportUpload = (req, res, next) => {
  uploadFields(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError('File is too large (maximum 5 MB)', 400));
      }
      return next(err instanceof AppError ? err : new AppError(err.message || 'Invalid image upload', 400));
    }
    req.file = req.file || req.files?.image?.[0] || req.files?.photo?.[0];
    next();
  });
};

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Project reports
 */

router.use(['/projects/:projectId/reports', '/reports'], auth);

/**
 * @swagger
 * /api/projects/{projectId}/reports:
 *   post:
 *     summary: Create report for a project
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReportInput'
 *     responses:
 *       201:
 *         description: Report created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReportResponse'
 */
router.post(
  '/projects/:projectId/reports',
  role('MANAGER'),
  handleReportUpload,
  validate(createReportSchema),
  reportController.createReport
);

/**
 * @swagger
 * /api/projects/{projectId}/reports:
 *   get:
 *     summary: Get reports for a project
 *     tags: [Reports]
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
 *         description: Project reports
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReportListResponse'
 */
router.get(
  '/projects/:projectId/reports',
  role('BOSS', 'MANAGER'),
  reportController.getProjectReports
);

/**
 * @swagger
 * /api/reports/{id}:
 *   get:
 *     summary: Get report details
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Report details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReportResponse'
 */
router.get(
  '/reports/:id',
  role('BOSS', 'MANAGER'),
  reportController.getReportById
);

/**
 * @swagger
 * /api/reports/{id}/photo:
 *   get:
 *     summary: Get report attached photo
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report photo binary stream
 *       404:
 *         description: Photo not found
 */
router.get(
  '/reports/:id/photo',
  role('BOSS', 'MANAGER'),
  reportController.getReportPhoto
);

module.exports = router;
