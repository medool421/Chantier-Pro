const express = require('express');
const router = express.Router();

const projectController = require('../controllers/project.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');

router.use(auth);

//  Boss & Manager only

router.post(
  '/',
  role('BOSS', 'MANAGER'),
  projectController.createProject
);

router.get('/', 
    role('BOSS'), 
    projectController.getProjects);

router.get('/:id', 
  role('BOSS', 'MANAGER'),
  projectController.getProject);

router.put(
  '/:id',
  role('BOSS', 'MANAGER'),
  projectController.updateProject
);

router.patch(
  '/:id/status',
  role('BOSS', 'MANAGER'),
  projectController.updateProjectStatus
);

router.delete(
  '/:id',
  role('BOSS'),
  projectController.deleteProject
);

router.patch(
  '/:id/assign-manager',
  role('BOSS'),
  projectController.assignManager
);

module.exports = router;