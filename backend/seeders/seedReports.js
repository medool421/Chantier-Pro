const { Report, Project, User } = require('../src/models');

const seedReports = async () => {
  console.log('📝 Seeding reports...');

  const project = await Project.findOne({ where: { name: 'Chantier A' } });
  const manager = await User.findOne({ where: { role: 'MANAGER' } });

  await Report.findOrCreate({
    where: {
      projectId: project.id,
      type: 'WEEKLY',
    },
    defaults: {
      title: 'Rapport Hebdomadaire',
      content:
        'Avancement correct du chantier. Travaux électriques en cours.',
      type: 'WEEKLY',
      projectId: project.id,
      userId: manager.id,
      reportDate: new Date(),
    },
  });

  console.log('✔ Reports seeded\n');
};

module.exports = seedReports;
