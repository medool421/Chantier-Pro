const router = require('express').Router();

const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validation.middleware');
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

module.exports = router;
