require('dotenv').config();
const { sequelize } = require('../src/models');
const seedUsers = require('./user.seeder');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    await seedUsers();
    console.log('Seeding done');

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
