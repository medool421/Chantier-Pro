const path = require('path');
process.env.NODE_ENV = 'test';

// load env FIRST
require('dotenv').config({
  path: path.resolve(process.cwd(), '.env.test'),
});

const { sequelize } = require('../config/database');

// IMPORTANT: load models & associations
require('../models');

beforeAll(async () => {
  await sequelize.authenticate();
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});