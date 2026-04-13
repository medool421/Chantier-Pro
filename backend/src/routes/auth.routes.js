const router = require('express').Router();

const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validation.middleware');
const authMiddleware = require('../middlewares/auth.middleware');

const {
  registerBossSchema,
  registerSchema,
  loginSchema,
} = require('../validators/auth.validator');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /api/auth/register-boss:
 *   post:
 *     summary: Register a new BOSS and create their company
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password, companyName]
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               companyName:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: BOSS and company created
 *       400:
 *         description: Validation error
 */
router.post(
  '/register-boss',
  validate(registerBossSchema),
  authController.registerBoss
);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register as an invited user (MANAGER or WORKER)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password]
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Validation error
 *       403:
 *         description: Cannot self-register as BOSS
 */
router.post(
  '/register',
  validate(registerSchema),
  authController.register
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login success
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account pending
 */
router.post(
  '/login',
  validate(loginSchema),
  authController.login
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile with company
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/me',
  authMiddleware,
  authController.me
);

module.exports = router;