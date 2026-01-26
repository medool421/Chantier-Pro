const { User } = require('../src/models');

const seedUsers = async () => {
  console.log('👥 Seeding users...');

  const users = [
    // Boss
    {
      firstName: 'Boss',
      lastName: 'Admin',
      email: 'boss@test.com',
      passwordHash: 'password123',
      role: 'BOSS',
    },

    // Managers (3)
    ...[1, 2, 3].map((i) => ({
      firstName: `Manager`,
      lastName: `${i}`,
      email: `manager${i}@test.com`,
      passwordHash: 'password123',
      role: 'MANAGER',
    })),

    // Workers (9)
    ...Array.from({ length: 9 }).map((_, i) => ({
      firstName: 'Worker',
      lastName: `${i + 1}`,
      email: `worker${i + 1}@test.com`,
      passwordHash: 'password123',
      role: 'WORKER',
    })),
  ];

  for (const user of users) {
    await User.findOrCreate({
      where: { email: user.email },
      defaults: user,
    });
  }

  console.log('✔ Users seeded');
};

module.exports = seedUsers;
