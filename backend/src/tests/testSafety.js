const { QueryTypes } = require('sequelize');

const requiredEnvironment = [
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

function safetyError(message) {
  return new Error(`Destructive test database guard: ${message}`);
}

function value(name) {
  const configured = process.env[name];
  if (!configured || !configured.trim()) {
    throw safetyError(`${name} must be configured`);
  }
  return configured;
}

function sameValue(actual, expected) {
  return String(actual || '') === String(expected || '');
}

function assertDestructiveTestConfiguration() {
  if (process.env.NODE_ENV !== 'test') {
    throw safetyError('NODE_ENV must be test');
  }

  if (process.env.ALLOW_DESTRUCTIVE_TEST_DB !== 'true') {
    throw safetyError('ALLOW_DESTRUCTIVE_TEST_DB=true is required');
  }

  requiredEnvironment.forEach(value);

  const expectedPort = value('TEST_DB_EXPECTED_PORT');
  if (!/^\d+$/.test(expectedPort)) {
    throw safetyError('TEST_DB_EXPECTED_PORT must be numeric');
  }

  const configuredIdentity = [
    ['DB_HOST', 'TEST_DB_EXPECTED_HOST'],
    ['DB_PORT', 'TEST_DB_EXPECTED_PORT'],
    ['DB_NAME', 'TEST_DB_EXPECTED_NAME'],
    ['DB_USER', 'TEST_DB_EXPECTED_ROLE'],
  ];

  for (const [configured, expected] of configuredIdentity) {
    if (!sameValue(value(configured), value(expected))) {
      throw safetyError(`${configured} does not match ${expected}`);
    }
  }
}

async function verifyDestructiveTestDatabase(sequelize) {
  // Configuration is checked before opening a connection. The remaining
  // checks deliberately use PostgreSQL's connection-local identity values.
  assertDestructiveTestConfiguration();
  await sequelize.authenticate();

  const rows = await sequelize.query(
    `SELECT current_database() AS "databaseName",
            inet_server_addr()::text AS "serverAddress",
            inet_server_port() AS "serverPort",
            current_user AS "databaseRole",
            COALESCE(shobj_description(d.oid, 'pg_database'), '') AS "databaseMarker"
       FROM pg_database d
      WHERE d.datname = current_database()`,
    { type: QueryTypes.SELECT }
  );

  if (rows.length !== 1) {
    throw safetyError('connected database identity could not be verified');
  }

  const identity = rows[0];
  const expectedIdentity = [
    ['databaseName', value('TEST_DB_EXPECTED_NAME')],
    ['serverAddress', value('TEST_DB_EXPECTED_HOST')],
    ['serverPort', value('TEST_DB_EXPECTED_PORT')],
    ['databaseRole', value('TEST_DB_EXPECTED_ROLE')],
    ['databaseMarker', value('TEST_DB_EXPECTED_MARKER')],
  ];

  for (const [field, expected] of expectedIdentity) {
    if (!sameValue(identity[field], expected)) {
      throw safetyError(`connected ${field} did not match the configured test identity`);
    }
  }
}

module.exports = {
  assertDestructiveTestConfiguration,
  verifyDestructiveTestDatabase,
};
