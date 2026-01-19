const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authValidator = require('../validators/auth.validator');
const validate = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/auth.middleware');

/**
 * @route   POST /api/v1/auth/register
 * @desc    Inscription d'un nouvel utilisateur
 * @access  Public
 */
router.post(
  '/register',
  validate(authValidator.register),
  authController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Connexion d'un utilisateur
 * @access  Public
 */
router.post(
  '/login',
  validate(authValidator.login),
  authController.login
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Rafraîchir le token d'accès
 * @access  Public
 */
router.post(
  '/refresh',
  validate(authValidator.refresh),
  authController.refresh
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Récupérer le profil de l'utilisateur connecté
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  authController.getMe
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Déconnexion
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

module.exports = router;