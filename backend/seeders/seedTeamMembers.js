const { Team, TeamMember, User } = require('../src/models');

const seedTeamMembers = async () => {
  console.log('👥 Seeding team members...');

  const teams = await Team.findAll();

  const managers = await User.findAll({
    where: { role: 'MANAGER' },
    order: [['createdAt', 'ASC']],
  });

  const workers = await User.findAll({
    where: { role: 'WORKER' },
    order: [['createdAt', 'ASC']],
  });

  let workerIndex = 0;

  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];
    const manager = managers[i];

    if (!manager) continue;

    // ➤ Manager joins team
    await TeamMember.findOrCreate({
      where: {
        teamId: team.id,
        userId: manager.id,
      },
      defaults: {
        roleInTeam: 'MANAGER',
        isActive: true,
      },
    });

    // ➤ 3 workers per team
    for (let j = 0; j < 3; j++) {
      const worker = workers[workerIndex++];
      if (!worker) break;

      await TeamMember.findOrCreate({
        where: {
          teamId: team.id,
          userId: worker.id,
        },
        defaults: {
          roleInTeam: 'WORKER',
          isActive: true,
        },
      });
    }

    console.log(`✔ Team members assigned for ${team.name}`);
  }

  console.log('✔ Team members seeded');
};

module.exports = seedTeamMembers;
