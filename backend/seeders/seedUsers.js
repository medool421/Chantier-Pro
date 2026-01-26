const authService = require('../src/services/auth.service');
const { User } = require('../src/models');

const seedUsers = async () => {
  console.log('👥 Seeding users...');

  const users = [
    {
      firstName: 'Boss',
      lastName: 'Admin',
      email: 'boss@test.com',
      password: 'password123', 
      role: 'BOSS',
    },
    {
      firstName: 'Manager',
      lastName: 'One',
      email: 'manager1@test.com',
      password: 'password123',
      role: 'MANAGER',
    },
    {
      firstName: 'Manager',
      lastName: 'Two',
      email: 'manager2@test.com',
      password: 'password123',
      role: 'MANAGER',
    },
    {
      firstName: 'Worker',
      lastName: 'One',
      email: 'worker1@test.com',
      password: 'password123',
      role: 'WORKER',
    },
    {
      firstName: 'Worker',
      lastName: 'Two',
      email: 'worker2@test.com',
      password: 'password123',
      role: 'WORKER',
    },
  ];

  for (const userData of users) {
    try {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findOne({ where: { email: userData.email } });
      
      if (!existingUser) {
        // Utiliser le service d'inscription qui gère correctement le hash
        await authService.register(userData);
        console.log(`✓ Created ${userData.role}: ${userData.email}`);
      } else {
        console.log(`⚠ User already exists: ${userData.email}`);
      }
    } catch (error) {
      console.error(`✗ Error creating ${userData.email}:`, error.message);
    }
  }

  console.log('✅ Users seeded\n');
};

module.exports = seedUsers;