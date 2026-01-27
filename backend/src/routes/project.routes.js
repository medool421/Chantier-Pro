const express = require('express');
const router = express.Router();

const projectController = require('../controllers/project.controller');
const taskController = require('../controllers/task.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');

const {
  createProjectSchema,
  updateProjectSchema,
  updateStatusSchema,
  assignManagerSchema
} = require('../validators/project.validator');

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management
 */

router.use(auth);

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProjectInput'
 *     responses:
 *       201:
 *         description: Project created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectResponse'
 *       403:
 *         description: Forbidden
 */
router.post(
  '/',
  role('BOSS'),
  validate(createProjectSchema),
  projectController.createProject
);

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects for boss
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of projects
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectListResponse'
 */
router.get(
  '/',
  role('BOSS'),
  projectController.getProjects
);

/**
 * @swagger
 * /api/projects/managers:
 *   get:
 *     summary: Get list of managers
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of managers
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserListResponse'
 */
router.get(
  '/managers',
  role('BOSS'),
  projectController.getManagers
);

/**
 * @swagger
 * /api/projects/my-project:
 *   get:
 *     summary: Get project assigned to manager
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Manager project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectResponse'
 */
router.get(
  '/my-project',
  role('MANAGER'),
  projectController.getMyProject
);

/**
 * @swagger
 * /api/projects/{id}/team:
 *   get:
 *     summary: Get project team
 *     tags: [Projects]
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
 *         description: Project team
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeamResponse'
 */
router.get(
  '/:id/team',
  role('BOSS', 'MANAGER'),
  projectController.getProjectTeam
);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get project details
 *     tags: [Projects]
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
 *         description: Project details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectResponse'
 */
router.get(
  '/:id',
  role('BOSS', 'MANAGER'),
  projectController.getProject
);

/**
 * @swagger
 * /api/projects/{id}/tasks:
 *   get:
 *     summary: Get tasks for a project
 *     tags: [Projects]
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
 *         description: Project tasks
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskListResponse'
 */
router.get(
  '/:id/tasks',
  role('BOSS', 'MANAGER'),
  (req, res, next) => {
    req.params.projectId = req.params.id;
    next();
  },
  taskController.getProjectTasks
);

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Update project
 *     tags: [Projects]
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
 *             $ref: '#/components/schemas/UpdateProjectInput'
 *     responses:
 *       200:
 *         description: Project updated
 */
router.put(
  '/:id',
  role('BOSS'),
  validate(updateProjectSchema),
  projectController.updateProject
);

/**
 * @swagger
 * /api/projects/{id}/status:
 *   patch:
 *     summary: Update project status
 *     tags: [Projects]
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
 *             $ref: '#/components/schemas/UpdateProjectStatusInput'
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch(
  '/:id/status',
  role('BOSS', 'MANAGER'),
  validate(updateStatusSchema),
  projectController.updateProjectStatus
);

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete project
 *     tags: [Projects]
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
 *         description: Project deleted
 */
router.delete(
  '/:id',
  role('BOSS'),
  projectController.deleteProject
);

/**
 * @swagger
 * /api/projects/{id}/assign-manager:
 *   patch:
 *     summary: Assign manager to project
 *     tags: [Projects]
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
 *             $ref: '#/components/schemas/AssignManagerInput'
 *     responses:
 *       200:
 *         description: Manager assigned
 */
router.patch(
  '/:id/assign-manager',
  role('BOSS'),
  validate(assignManagerSchema),
  projectController.assignManager
);

module.exports = router;
