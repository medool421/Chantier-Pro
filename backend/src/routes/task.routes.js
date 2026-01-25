const express = require('express');
const router = express.Router();

const taskController = require('../controllers/task.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');

const {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} = require('../validators/task.validator');

router.use(auth);

// Manager creates task
router.post(
  '/projects/:projectId/tasks',
  role('MANAGER'),
  validate(createTaskSchema),
  taskController.createTask
);

// Boss & Manager view tasks of a project
router.get(
  '/projects/:projectId/tasks',
  role('BOSS', 'MANAGER'),
  taskController.getProjectTasks
);

// Worker gets his tasks
router.get(
  '/tasks/my',
  role('WORKER'),
  taskController.getMyTasks
);

// Manager updates task
router.put(
  '/tasks/:id',
  role('MANAGER'),
  validate(updateTaskSchema),
  taskController.updateTask
);

// Manager & Worker update task status
router.patch(
  '/tasks/:id/status',
  role('MANAGER', 'WORKER'),
  validate(updateTaskStatusSchema),
  taskController.updateTaskStatus
);

// Manager deletes task
router.delete(
  '/tasks/:id',
  role('MANAGER'),
  taskController.deleteTask
);

module.exports = router;
