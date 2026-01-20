const { User } = require('../src/models');

const seedUsers = async () => {
  console.log('Seeding users...');

  const users = [
    {
      firstName: 'Boss',
      lastName: 'One',
      email: 'boss@chantierpro.com',
      passwordHash: 'password123',
      role: 'BOSS',
    },
    {
      firstName: 'Manager',
      lastName: 'One',
      email: 'manager@chantierpro.com',
      passwordHash: 'password123',
      role: 'MANAGER',
    },
    {
      firstName: 'Worker',
      lastName: 'One',
      email: 'worker1@chantierpro.com',
      passwordHash: 'password123',
      role: 'WORKER',
    },
    {
      firstName: 'Worker',
      lastName: 'Two',
      email: 'worker2@chantierpro.com',
      passwordHash: 'password123',
      role: 'WORKER',
    },
  ];

  for (const user of users) {
    const exists = await User.findOne({ where: { email: user.email } });
    if (!exists) {
      await User.create(user);
      console.log(`✔ Created ${user.role}: ${user.email}`);
    }
  }

  console.log('User seeding completed');
};

module.exports = seedUsers;
