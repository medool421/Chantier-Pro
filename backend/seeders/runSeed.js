require('dotenv').config();
const { sequelize } = require('../src/config/database');

const seedUsers = require('./seedUsers');
const seedProjects = require('./seedProjects');
const seedTeams = require('./seedTeams');
const seedTasks = require('./seedTasks');
const seedReports = require('./seedReports');

const seed = async () => {
  try {
    console.log('\n🌱 ChantierPro Seeding Started\n');

    await sequelize.authenticate();

    await seedUsers();
    await seedProjects();
    await seedTeams();
    await seedTasks();
    await seedReports();

    console.log('✨ DATABASE SEEDED SUCCESSFULLY ✨\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ SEED FAILED:', error);
    process.exit(1);
  }
};

seed();
