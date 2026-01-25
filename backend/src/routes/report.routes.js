const express = require('express');
const router = express.Router();

const reportController = require('../controllers/report.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');

const {
  createReportSchema,
} = require('../validators/report.validator');

router.use(auth);

// Manager creates report
router.post(
  '/projects/:projectId/reports',
  role('MANAGER'),
  validate(createReportSchema),
  reportController.createReport
);

// Boss & Manager get reports of a project
router.get(
  '/projects/:projectId/reports',
  role('BOSS', 'MANAGER'),
  reportController.getProjectReports
);

// Boss & Manager get single report
router.get(
  '/reports/:id',
  role('BOSS', 'MANAGER'),
  reportController.getReportById
);

module.exports = router;
