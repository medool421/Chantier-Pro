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

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management
 */

router.use(auth);

/**
 * @swagger
 * /api/projects/{projectId}/tasks:
 *   post:
 *     summary: Create task for a project
 *     tags: [Tasks]
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
 *             $ref: '#/components/schemas/CreateTaskInput'
 *     responses:
 *       201:
 *         description: Task created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskResponse'
 */
router.post(
  '/projects/:projectId/tasks',
  role('MANAGER'),
  validate(createTaskSchema),
  taskController.createTask
);

/**
 * @swagger
 * /api/projects/{projectId}/tasks:
 *   get:
 *     summary: Get tasks for a project
 *     tags: [Tasks]
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
 *         description: Project tasks
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskListResponse'
 */
router.get(
  '/projects/:projectId/tasks',
  role('BOSS', 'MANAGER'),
  taskController.getProjectTasks
);

/**
 * @swagger
 * /api/tasks/my:
 *   get:
 *     summary: Get tasks assigned to current worker
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Worker tasks
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskListResponse'
 */
router.get(
  '/tasks/my',
  role('WORKER'),
  taskController.getMyTasks
);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get task details
 *     tags: [Tasks]
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
 *         description: Task details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskResponse'
 */
router.get(
  '/tasks/:id',
  role('BOSS', 'MANAGER', 'WORKER'),
  taskController.getTaskById
);

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTaskInput'
 *     responses:
 *       200:
 *         description: Task updated
 */
router.put(
  '/tasks/:id',
  role('MANAGER'),
  validate(updateTaskSchema),
  taskController.updateTask
);

/**
 * @swagger
 * /api/tasks/{id}/status:
 *   patch:
 *     summary: Update task status
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTaskStatusInput'
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch(
  '/tasks/:id/status',
  role('MANAGER', 'WORKER'),
  validate(updateTaskStatusSchema),
  taskController.updateTaskStatus
);

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete task
 *     tags: [Tasks]
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
 *         description: Task deleted
 */
router.delete(
  '/tasks/:id',
  role('MANAGER'),
  taskController.deleteTask
);

module.exports = router;
