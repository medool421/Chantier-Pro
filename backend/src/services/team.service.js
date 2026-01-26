const { Team, TeamMember, Project, User } = require('../models');
const AppError = require('../utils/AppError');

async function createTeam(data, userId) {
    // Check if project exists and user has rights (Manager/Boss)
    const project = await Project.findByPk(data.projectId);
    if (!project) throw new AppError('Project not found', 404);

    // Check if a team already exists for this project? 
    // The model relation is Project.hasOne(Team), so yes.
    const existingTeam = await Team.findOne({ where: { projectId: data.projectId } });
    if (existingTeam) throw new AppError('Project already has a team', 400);

    // Authorization check could be here or middleware. 
    // Assuming middleware handles role, but we might want to checks if Manager owns the project
    if (project.managerId !== userId && project.bossId !== userId) {
        // If strict checking is needed. For now relying on Route Role Middleware.
    }

    const team = await Team.create(data);
    return team;
}

async function getTeamById(id) {
    const team = await Team.findByPk(id, {
        include: [
            {
                model: TeamMember,
                include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'role'] }]
            },
            { model: Project, attributes: ['id', 'name'] }
        ]
    });

    if (!team) throw new AppError('Team not found', 404);
    return team;
}

async function updateTeam(id, data) {
    const team = await getTeamById(id);
    await team.update(data);
    return team;
}

async function deleteTeam(id) {
    const team = await getTeamById(id);
    await team.destroy();
}

async function addMember(teamId, userId, roleInTeam) {
    const team = await Team.findByPk(teamId);
    if (!team) throw new AppError('Team not found', 404);

    const user = await User.findByPk(userId);
    if (!user) throw new AppError('User not found', 404);

    // Check if already a member
    const existingMember = await TeamMember.findOne({ where: { teamId, userId } });
    if (existingMember) throw new AppError('User is already in the team', 400);

    const member = await TeamMember.create({
        teamId,
        userId,
        roleInTeam
    });

    return member;
}

async function removeMember(teamId, userId) {
    const member = await TeamMember.findOne({ where: { teamId, userId } });
    if (!member) throw new AppError('Member not found in this team', 404);

    await member.destroy();
}

async function getTeams(filters = {}) {
    // Basic listing, maybe filter by project
    const where = {};
    if (filters.projectId) where.projectId = filters.projectId;

    return Team.findAll({
        where,
        include: [
            { model: Project, attributes: ['id', 'name'] }
        ]
    });
}

async function getProjectTeam(filters = {}) {
    const where = {};

    // Handle if filters is just an ID (string or number)
    if (typeof filters === 'string' || typeof filters === 'number') {
        where.projectId = filters;
    } else {
        // Apply filters from object
        if (filters.projectId) where.projectId = filters.projectId;
        if (filters.id) where.id = filters.id;
    }

    return await Team.findAll({
        where,
        include: [
            {
                model: TeamMember,
                include: [
                    {
                        model: User,
                        attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
                    },
                ],
            },
            // Including Project info as per your second example
            {
                model: Project,
                attributes: ['id', 'name']
            }
        ],
    });
}

module.exports = {
    createTeam,
    getTeamById,
    updateTeam,
    deleteTeam,
    addMember,
    removeMember,
    getTeams,
    getProjectTeam
};
