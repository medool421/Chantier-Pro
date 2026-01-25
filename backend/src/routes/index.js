const express = require('express');
const router = express.Router();

// Import des routes
const authRoutes = require('./auth.routes');
// const userRoutes = require('./user.routes');
const projectRoutes = require('./project.routes');
// const taskRoutes = require('./task.routes');

// Route de bienvenue de l'API
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Bienvenue sur l\'API ChantierPro',
    version: process.env.API_VERSION || 'v1',
    documentation: `/api/${process.env.API_VERSION || 'v1'}/docs`,
    endpoints: {
      auth: '/auth',
      users: '/users',
      projects: '/projects',
      tasks: '/tasks',
    },
  });
});

// Montage des routes
router.use('/');
router.use('/auth', authRoutes);
// router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
// router.use('/tasks', taskRoutes);

module.exports = router;