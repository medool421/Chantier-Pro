const { Company, User } = require('../src/models');

const seedUsers = async () => {
  console.log('👥 Seeding users...');

  const [company] = await Company.findOrCreate({
    where: { name: 'ChantierPro Demo' },
    defaults: { name: 'ChantierPro Demo' },
  });

  const users = [
    // Boss
    {
      firstName: 'Boss',
      lastName: 'Admin',
      email: 'boss@test.com',
      passwordHash: 'password123',
      role: 'BOSS',
      companyId: company.id,
    },

    // Managers (3)
    ...[1, 2, 3].map((i) => ({
      firstName: `Manager`,
      lastName: `${i}`,
      email: `manager${i}@test.com`,
      passwordHash: 'password123',
      role: 'MANAGER',
      companyId: company.id,
    })),

    // Workers (9)
    ...Array.from({ length: 9 }).map((_, i) => ({
      firstName: 'Worker',
      lastName: `${i + 1}`,
      email: `worker${i + 1}@test.com`,
      passwordHash: 'password123',
      role: 'WORKER',
      companyId: company.id,
    })),
  ];

  for (const user of users) {
    const [seededUser] = await User.findOrCreate({
      where: { email: user.email },
      defaults: user,
    });
    if (seededUser.companyId !== company.id) {
      await seededUser.update({ companyId: company.id });
    }
  }

  console.log('✔ Users seeded');
};

module.exports = seedUsers;
