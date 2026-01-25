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

router.use(auth);

// Create Team (Boss/Manager)
router.post(
    '/',
    role('BOSS', 'MANAGER'),
    validate(createTeamSchema),
    teamController.createTeam
);

// Get All Teams (Boss)
router.get(
    '/',
    role('BOSS'),
    teamController.getTeams
);

// Get Single Team (All/Members?) - restrict to specific roles for now
router.get('/:id', teamController.getTeam);

// Update Team
router.put(
    '/:id',
    role('BOSS', 'MANAGER'),
    validate(updateTeamSchema),
    teamController.updateTeam
);

// Delete Team
router.delete(
    '/:id',
    role('BOSS'),
    teamController.deleteTeam
);

// --- Members Management ---

router.post(
    '/:id/members',
    role('BOSS', 'MANAGER'),
    validate(addMemberSchema),
    teamController.addMember
);

router.delete(
    '/:id/members/:userId',
    role('BOSS', 'MANAGER'),
    teamController.removeMember
);

module.exports = router;
