const express = require('express');
const router = express.Router();

const invitationController = require('../controllers/invitation.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Invitations
 *   description: Company invitation management
 */

// ─── Public (no auth needed) ───────────────────────────────────────────────

/**
 * @swagger
 * /api/invitations/validate/{token}:
 *   get:
 *     summary: Validate an invitation token (used before register)
 *     tags: [Invitations]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Token is valid, returns email + role + company
 *       400:
 *         description: Token expired or already used
 *       404:
 *         description: Token not found
 */
router.get('/validate/:token', invitationController.validateToken);

// ─── Protected (auth required) ────────────────────────────────────────────
router.use(auth);

/**
 * @swagger
 * /api/invitations:
 *   post:
 *     summary: Send an invitation (BOSS only)
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, role]
 *             properties:
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [MANAGER, WORKER]
 *     responses:
 *       201:
 *         description: Invitation created
 *       409:
 *         description: Invitation already pending or user already in company
 */
router.post(
  '/',
  role('BOSS'),
  invitationController.sendInvitation
);

/**
 * @swagger
 * /api/invitations:
 *   get:
 *     summary: Get all invitations for the company (BOSS only)
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of invitations
 */
router.get(
  '/',
  role('BOSS'),
  invitationController.getCompanyInvitations
);

/**
 * @swagger
 * /api/invitations/accept:
 *   post:
 *     summary: Accept an invitation using a token
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invitation accepted, user linked to company
 *       400:
 *         description: Token expired or already used
 *       403:
 *         description: Token email does not match logged-in user
 */
router.post(
  '/accept',
  invitationController.acceptInvitation
);

/**
 * @swagger
 * /api/invitations/{id}/revoke:
 *   patch:
 *     summary: Revoke a pending invitation (BOSS only)
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invitation revoked
 *       400:
 *         description: Invitation is not pending
 *       404:
 *         description: Invitation not found
 */
router.patch(
  '/:id/revoke',
  role('BOSS'),
  invitationController.revokeInvitation
);

module.exports = router;