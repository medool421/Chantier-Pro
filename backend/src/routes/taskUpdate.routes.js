const express = require('express');
const multer = require('multer');
const router = express.Router();

const taskUpdateController = require('../controllers/taskUpdate.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const { createTaskUpdateSchema } = require('../validators/taskUpdate.validator');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }

    cb(null, true);
  },
});

router.use(auth);

router.post(
  '/task-updates',
  role('WORKER'),
  upload.single('image'),
  validate(createTaskUpdateSchema),
  taskUpdateController.createUpdate
);

router.get(
  '/task-updates/:updateId/photo',
  role('BOSS', 'MANAGER', 'WORKER'),
  taskUpdateController.getUpdatePhoto
);

router.get(
  '/tasks/:taskId/updates',
  role('BOSS', 'MANAGER', 'WORKER'),
  taskUpdateController.getUpdatesByTask
);

module.exports = router;
