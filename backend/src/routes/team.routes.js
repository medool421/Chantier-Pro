const express = require('express');
const router = express.Router();

const teamController = require('../controllers/team.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');

const {
  createTeamSchema,
  updateTeamSchema,
  addMemberSchema
} = require('../validators/team.validator');

/**
 * @swagger
 * tags:
 *   name: Teams
 *   description: Team management
 */

router.use(auth);

/**
 * @swagger
 * /api/teams:
 *   post:
 *     summary: Create a team
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTeamInput'
 *     responses:
 *       201:
 *         description: Team created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeamResponse'
 */
router.post(
  '/',
  role('BOSS', 'MANAGER'),
  validate(createTeamSchema),
  teamController.createTeam
);

/**
 * @swagger
 * /api/teams:
 *   get:
 *     summary: Get all teams
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of teams
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeamListResponse'
 */
router.get(
  '/',
  role('BOSS'),
  teamController.getTeams
);

/**
 * @swagger
 * /api/teams/{id}:
 *   put:
 *     summary: Update team
 *     tags: [Teams]
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
 *             $ref: '#/components/schemas/UpdateTeamInput'
 *     responses:
 *       200:
 *         description: Team updated
 */
router.put(
  '/:id',
  role('BOSS', 'MANAGER'),
  validate(updateTeamSchema),
  teamController.updateTeam
);

/**
 * @swagger
 * /api/teams/{id}:
 *   delete:
 *     summary: Delete team
 *     tags: [Teams]
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
 *         description: Team deleted
 */
router.delete(
  '/:id',
  role('BOSS'),
  teamController.deleteTeam
);

/**
 * @swagger
 * /api/teams/{id}/members:
 *   post:
 *     summary: Add member to team
 *     tags: [Teams]
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
 *             $ref: '#/components/schemas/AddTeamMemberInput'
 *     responses:
 *       200:
 *         description: Member added
 */
router.post(
  '/:id/members',
  role('BOSS', 'MANAGER'),
  validate(addMemberSchema),
  teamController.addMember
);

/**
 * @swagger
 * /api/teams/{id}/members/{userId}:
 *   delete:
 *     summary: Remove member from team
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Member removed
 */
router.delete(
  '/:id/members/:userId',
  role('BOSS', 'MANAGER'),
  teamController.removeMember
);

module.exports = router;
