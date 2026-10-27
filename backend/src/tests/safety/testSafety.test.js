const {
  assertDestructiveTestConfiguration,
  verifyDestructiveTestDatabase,
} = require('../../tests/testSafety');

const guardedKeys = [
  'NODE_ENV',
  'ALLOW_DESTRUCTIVE_TEST_DB',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'TEST_DB_EXPECTED_HOST',
  'TEST_DB_EXPECTED_PORT',
  'TEST_DB_EXPECTED_NAME',
  'TEST_DB_EXPECTED_ROLE',
  'TEST_DB_EXPECTED_MARKER',
];

function validEnvironment() {
  return {
    NODE_ENV: 'test',
    ALLOW_DESTRUCTIVE_TEST_DB: 'true',
    DB_HOST: '127.0.0.1',
    DB_PORT: '55432',
    DB_NAME: 'chantierpro_disposable',
    DB_USER: 'chantierpro_test_role',
    TEST_DB_EXPECTED_HOST: '127.0.0.1',
    TEST_DB_EXPECTED_PORT: '55432',
    TEST_DB_EXPECTED_NAME: 'chantierpro_disposable',
    TEST_DB_EXPECTED_ROLE: 'chantierpro_test_role',
    TEST_DB_EXPECTED_MARKER: 'chantierpro-disposable-marker',
  };
}

function setEnvironment(values) {
  guardedKeys.forEach((key) => delete process.env[key]);
  Object.assign(process.env, values);
}

function fakeSequelize(identity) {
  return {
    authenticate: jest.fn(() => Promise.resolve()),
    query: jest.fn(() => Promise.resolve([identity])),
  };
}

describe('destructive test database guard', () => {
  const originalEnvironment = {};

  beforeEach(() => {
    guardedKeys.forEach((key) => {
      originalEnvironment[key] = process.env[key];
    });
    setEnvironment(validEnvironment());
  });

  afterEach(() => {
    guardedKeys.forEach((key) => {
      if (originalEnvironment[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnvironment[key];
    });
  });

  test('requires an explicit destructive-test opt-in', () => {
    delete process.env.ALLOW_DESTRUCTIVE_TEST_DB;
    expect(assertDestructiveTestConfiguration).toThrow('ALLOW_DESTRUCTIVE_TEST_DB=true is required');
  });

  test('requires every expected identity setting', () => {
    delete process.env.TEST_DB_EXPECTED_MARKER;
    expect(assertDestructiveTestConfiguration).toThrow('TEST_DB_EXPECTED_MARKER must be configured');
  });

  [
    ['host', 'DB_HOST', 'TEST_DB_EXPECTED_HOST', '127.0.0.2'],
    ['port', 'DB_PORT', 'TEST_DB_EXPECTED_PORT', '55433'],
    ['database', 'DB_NAME', 'TEST_DB_EXPECTED_NAME', 'other_database'],
    ['role', 'DB_USER', 'TEST_DB_EXPECTED_ROLE', 'other_role'],
  ].forEach(([label, configuredKey, expectedKey, replacement]) => {
    test(`rejects a configured ${label} mismatch`, () => {
      process.env[expectedKey] = replacement;
      expect(assertDestructiveTestConfiguration).toThrow(`${configuredKey} does not match ${expectedKey}`);
    });
  });

  [
    ['serverAddress', '127.0.0.2'],
    ['serverPort', '55433'],
    ['databaseName', 'other_database'],
    ['databaseRole', 'other_role'],
    ['databaseMarker', 'wrong-marker'],
    ['databaseMarker', 'chantierpro-disposable-marker '],
  ].forEach(([field, replacement]) => {
    test(`rejects an actual ${field} mismatch`, async () => {
      const identity = {
        databaseName: process.env.TEST_DB_EXPECTED_NAME,
        serverAddress: process.env.TEST_DB_EXPECTED_HOST,
        serverPort: process.env.TEST_DB_EXPECTED_PORT,
        databaseRole: process.env.TEST_DB_EXPECTED_ROLE,
        databaseMarker: process.env.TEST_DB_EXPECTED_MARKER,
      };
      identity[field] = replacement;
      const sequelize = fakeSequelize(identity);

      let failure;
      try {
        await verifyDestructiveTestDatabase(sequelize);
      } catch (error) {
        failure = error;
      }

      expect(failure.message).toContain(`connected ${field} did not match`);
      expect(sequelize.authenticate.mock.calls.length).toBe(1);
    });
  });
});
