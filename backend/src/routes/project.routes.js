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

router.use(auth);

// Boss creates project
router.post(
  '/',
  role('BOSS'),
  validate(createProjectSchema),
  projectController.createProject
);

// Boss gets all his projects
router.get(
  '/',
  role('BOSS'),
  projectController.getProjects
);

// Boss gets managers list (must come before /:id route)
router.get(
  '/managers',
  role('BOSS'),
  projectController.getManagers
);

router.get(
  '/my-project',
  role('MANAGER'),
  projectController.getMyProject
);

// Boss & Manager get tasks for a project
router.get(
  '/:id/tasks',
  role('BOSS', 'MANAGER'),
  (req, res, next) => {
    // Map :id to :projectId for the task controller
    req.params.projectId = req.params.id;
    next();
  },
  taskController.getProjectTasks
);

// Boss & Manager get project details
router.get(
  '/:id',
  role('BOSS', 'MANAGER'),
  projectController.getProject
);

// Boss updates project info
router.put(
  '/:id',
  role('BOSS'),
  validate(updateProjectSchema),
  projectController.updateProject
);

// Boss & Manager update status
router.patch(
  '/:id/status',
  role('BOSS', 'MANAGER'),
  validate(updateStatusSchema),
  projectController.updateProjectStatus
);

// Boss deletes project
router.delete(
  '/:id',
  role('BOSS'),
  projectController.deleteProject
);

// Boss assigns manager
router.patch(
  '/:id/assign-manager',
  role('BOSS'),
  validate(assignManagerSchema),
  projectController.assignManager
);


module.exports = router;