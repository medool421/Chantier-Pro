const path = require('path');
process.env.NODE_ENV = 'test';

// load env FIRST
require('dotenv').config({
  path: path.resolve(process.cwd(), '.env.test'),
});

const {
  createIsolatedTestStorageRoot,
  cleanupIsolatedTestStorageRoot,
} = require('./testStorage');
const {
  assertDestructiveTestConfiguration,
  verifyDestructiveTestDatabase,
} = require('./testSafety');

// Fail before creating a test artifact or importing application modules when
// the operator has not supplied the destructive-test contract.
assertDestructiveTestConfiguration();

// This runs before Jest loads test modules, so Multer receives the isolated
// directory rather than the development uploads directory.
createIsolatedTestStorageRoot();

const { sequelize } = require('../config/database');

// IMPORTANT: load models & associations
require('../models');

beforeAll(async () => {
  await verifyDestructiveTestDatabase(sequelize);
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  try {
    await sequelize.close();
  } finally {
    cleanupIsolatedTestStorageRoot();
  }
});
