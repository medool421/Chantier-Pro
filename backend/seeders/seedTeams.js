const { Team, Project } = require('../src/models');

const seedTeams = async () => {
  console.log('👷 Seeding teams...');

  const projects = await Project.findAll();

  for (const project of projects) {
    await Team.findOrCreate({
      where: { projectId: project.id },
      defaults: {
        name: `Équipe ${project.name}`,
        projectId: project.id,
      },
    });
  }

  console.log('✔ Teams seeded');
};

module.exports = seedTeams;
