const express = require('express');
const router = express.Router();

const fileController = require('../controllers/file.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const upload = require('../config/multer');

const { uploadFileSchema } = require('../validators/file.validator');

router.use(auth);

// Upload file (Worker / Manager)
router.post(
  '/',
  role('WORKER', 'MANAGER'),
  upload.single('file'),
  validate(uploadFileSchema),
  fileController.uploadFile
);

// Get files of a project
router.get(
  '/projects/:projectId',
  role('BOSS', 'MANAGER'),
  fileController.getProjectFiles
);

// Delete file (Manager)
router.delete(
  '/:id',
  role('MANAGER'),
  fileController.deleteFile
);

module.exports = router;