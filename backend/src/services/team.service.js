const { Team, TeamMember, Project, User } = require('../models');
const AppError = require('../utils/AppError');
const {
    findAuthorizedProject,
    assertAuthorizedProject,
    projectAccessWhere,
} = require('../utils/projectAccess');

async function createTeam(data, user) {
    await findAuthorizedProject(data.projectId, user);

    const existingTeam = await Team.findOne({ where: { projectId: data.projectId } });
    if (existingTeam) throw new AppError('Project already has a team', 400);

    const team = await Team.create(data);
    return team;
}

async function getTeamById(id, user) {
    const team = await Team.findByPk(id, {
        include: [
            {
                model: TeamMember,
                as: 'members',

                include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'role'] }]
            },
            {
                model: Project,
                as: 'project',
                attributes: ['id', 'name', 'companyId', 'managerId', 'bossId'],
            }
        ]
    });

    if (!team) throw new AppError('Team not found', 404);
    assertAuthorizedProject(team.project, user);
    return team;
}

async function updateTeam(id, data, user) {
    const team = await getTeamById(id, user);
    await team.update(data);
    return team;
}

async function deleteTeam(id, user) {
    const team = await getTeamById(id, user);
    await team.destroy();
}

async function addMember(teamId, userId, roleInTeam, requester) {
    const team = await getTeamById(teamId, requester);
    const memberCompanyId = team.project.companyId || requester.companyId;

    const member = await User.findOne({
        where: {
            id: userId,
            companyId: memberCompanyId,
            role: 'WORKER',
            isActive: true,
            status: 'ACTIVE',
        }
    });
    if (!member) throw new AppError('User not found in the project company', 404);

    if (roleInTeam && roleInTeam !== 'WORKER') {
        throw new AppError('Only workers can be added through team membership', 400);
    }

    // Check if already a member
    const existingMember = await TeamMember.findOne({ where: { teamId, userId } });
    if (existingMember) throw new AppError('User is already in the team', 400);

    const createdMember = await TeamMember.create({
        teamId,
        userId,
        roleInTeam: 'WORKER'
    });

    return createdMember;
}

async function removeMember(teamId, userId, user) {
    await getTeamById(teamId, user);
    const member = await TeamMember.findOne({ where: { teamId, userId } });
    if (!member) throw new AppError('Member not found in this team', 404);

    await member.destroy();
}

async function getTeams(filters = {}, user) {
    // Basic listing, maybe filter by project
    const where = {};
    if (filters.projectId) where.projectId = filters.projectId;

    return Team.findAll({
        where,
        include: [
            {
                model: Project,
                attributes: ['id', 'name', 'companyId', 'managerId', 'bossId'],
                where: projectAccessWhere(user),
                required: true,
            }
        ]
    });
}

async function getProjectTeam(projectId, user) {
  await findAuthorizedProject(projectId, user);

  const team = await Team.findOne({
    where: { projectId },
    include: [
      {
        model: TeamMember,
        as: 'members', 
        include: [
          {
            model: User,
            as: 'user', 
            attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
          },
        ],
      },
      {
        model: Project,
        as: 'project', 
        attributes: ['id', 'name', 'companyId', 'managerId', 'bossId'],
      },
    ],
  });

  return team;
}

module.exports = {
    createTeam,
    getTeamById,
    updateTeam,
    deleteTeam,
    addMember,
    removeMember,
    getTeams,
    getProjectTeam,
};
