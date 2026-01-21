const router = require('express').Router();

const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validation.middleware');
const authMiddleware = require('../middlewares/auth.middleware');

const {
  registerSchema,
  loginSchema,
} = require('../validators/auth.validator');

router.post(
  '/register',
  validate(registerSchema),
  authController.register
);

router.post(
  '/login',
  validate(loginSchema),
  authController.login
);

router.get(
  '/me', 
  authMiddleware, authController.me);

module.exports = router;
