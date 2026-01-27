const { Project, User } = require('../src/models');

const seedProjects = async () => {
  console.log('🏗 Seeding projects...');

  const boss = await User.findOne({ where: { role: 'BOSS' } });
  const manager1 = await User.findOne({ where: { email: 'manager1@test.com' } });
  const manager2 = await User.findOne({ where: { email: 'manager2@test.com' } });
  const manager3 = await User.findOne({ where: { email: 'manager3@test.com' } });

  const projects = [
    {
      name: 'Chantier A',
      description: 'Installation électrique complète',
      address: 'Casablanca',
      status: 'IN_PROGRESS',
      bossId: boss.id,
      managerId: manager1.id,
    },
    {
      name: 'Chantier B',
      description: 'Rénovation réseau électrique',
      address: 'Rabat',
      status: 'PLANNED',
      bossId: boss.id,
      managerId: manager2.id,
    },
    {
      name: 'Chantier C',
      description: 'Projet sans chef de chantier',
      address: 'Agadir',
      status: 'PLANNED',
      bossId: boss.id,
      managerId: manager3.id,
    },
  ];

  for (const project of projects) {
    await Project.findOrCreate({
      where: { name: project.name },
      defaults: {
        ...project,
        startDate: new Date(),
      },
    });
  }

  console.log('✔ Projects seeded\n');
};

module.exports = seedProjects;
