const { Task, Project, User } = require('../src/models');

const seedTasks = async () => {
  console.log('✅ Seeding tasks...');

  const manager = await User.findOne({ where: { role: 'MANAGER' } });
  const [worker1, worker2] = await User.findAll({ where: { role: 'WORKER' } });
  const projects = await Project.findAll();

  const tasks = [
    {
      title: 'Installer tableau',
      description: 'Installation du tableau électrique',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      projectId: projects[0].id,
      assignedTo: worker1.id,
    },
    {
      title: 'Tirage câbles',
      description: 'Passage des câbles principaux',
      status: 'TODO',
      priority: 'NORMAL',
      projectId: projects[0].id,
      assignedTo: worker2.id,
    },
    {
      title: 'Vérification finale',
      description: 'Contrôle de conformité',
      status: 'TODO',
      priority: 'HIGH',
      projectId: projects[1].id,
      assignedTo: worker1.id,
    },
  ];

  for (const task of tasks) {
    await Task.findOrCreate({
      where: {
        title: task.title,
        projectId: task.projectId,
      },
      defaults: {
        ...task,
        createdBy: manager.id,
      },
    });
  }

  console.log('✔ Tasks seeded\n');
};

module.exports = seedTasks;
