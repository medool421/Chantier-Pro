const { Team, TeamMember, Project, User } = require('../src/models');

const seedTeams = async () => {
  console.log('👷 Seeding teams & members...');

  const manager = await User.findOne({ where: { role: 'MANAGER' } });
  const workers = await User.findAll({ where: { role: 'WORKER' } });

  const projects = await Project.findAll({
    where: { managerId: manager.id },
  });

  for (const project of projects) {
    const [team] = await Team.findOrCreate({
      where: { projectId: project.id },
      defaults: {
        name: `Équipe ${project.name}`,
        projectId: project.id,
      },
    });

    const members = [manager, ...workers];

    for (const user of members) {
      await TeamMember.findOrCreate({
        where: {
          teamId: team.id,
          userId: user.id,
        },
        defaults: {
          roleInTeam: user.role === 'MANAGER' ? 'MANAGER' : 'WORKER',
          isActive: true,
        },
      });
    }

    console.log(`✔ Team seeded for ${project.name}`);
  }

  console.log('✔ Teams & members seeded\n');
};

module.exports = seedTeams;
