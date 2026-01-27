require('dotenv').config();
const { sequelize } = require('../src/config/database');

const seedUsers = require('./seedUsers');
const seedProjects = require('./seedProjects');
const seedTeams = require('./seedTeams');
const seedTasks = require('./seedTasks');
const seedReports = require('./seedReports');
const seedTeamMembers = require('./seedTeamMembers');

const seed = async () => {
  try {
    console.log('\n🌱 ChantierPro Seeding Started\n');

    await sequelize.authenticate();

    console.log('🧹 Dropping all tables...');
    await sequelize.sync({ force: true }); 
    console.log('✅ Database reset complete\n');

    await seedUsers();
    await seedProjects();
    await seedTeams();
    await seedTeamMembers();
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
