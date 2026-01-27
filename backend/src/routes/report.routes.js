const express = require('express');
const router = express.Router();

const reportController = require('../controllers/report.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');

const {
  createReportSchema,
} = require('../validators/report.validator');

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Project reports
 */

router.use(auth);

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

module.exports = router;
