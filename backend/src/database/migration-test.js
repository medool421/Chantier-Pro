const { QueryTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { getMigrationFiles, migrateDown, migrateUp, migrationStatus } = require('./migrate');
const { verifyDestructiveTestDatabase } = require('../tests/testSafety');

const legacyFileId = '11111111-1111-4111-8111-111111111111';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function makeLegacyFixture() {
  const { Company, User, Project } = require('../models');
  const company = await Company.create({ name: 'Migration Test Company' });
  const user = await User.create({
    firstName: 'Migration',
    lastName: 'Tester',
    email: 'migration.test@example.com',
    passwordHash: 'test-password',
    role: 'BOSS',
    companyId: company.id,
  });
  const project = await Project.create({
    name: 'Migration Test Project',
    companyId: company.id,
    bossId: user.id,
  });

  await sequelize.query(`
    ALTER TABLE "files"
      ALTER COLUMN "originalName" DROP NOT NULL,
      ALTER COLUMN "mimeType" DROP NOT NULL,
      ALTER COLUMN "size" DROP NOT NULL,
      ALTER COLUMN "projectId" DROP NOT NULL,
      ALTER COLUMN "uploadedBy" DROP NOT NULL,
      ALTER COLUMN "type" DROP NOT NULL,
      ALTER COLUMN "createdAt" DROP NOT NULL,
      ALTER COLUMN "updatedAt" DROP NOT NULL
  `);
  await sequelize.query(
    `INSERT INTO "files" ("id", "url", "caption", "type", "takenAt")
     VALUES (:id, :url, :caption, NULL, :takenAt)`,
    {
      replacements: {
        id: legacyFileId,
        url: '/uploads/legacy-missing-metadata.jpg',
        caption: 'Legacy fixture',
        takenAt: new Date(),
      },
    }
  );

  return { user, project };
}

async function repairLegacyFixture({ user, project }) {
  await sequelize.query(
    `UPDATE "files"
        SET "originalName" = :originalName,
            "mimeType" = :mimeType,
            "size" = :size,
            "projectId" = :projectId,
            "uploadedBy" = :uploadedBy,
            "type" = :type,
            "createdAt" = :createdAt,
            "updatedAt" = :updatedAt
      WHERE "id" = :id`,
    {
      replacements: {
        id: legacyFileId,
        originalName: 'legacy-missing-metadata.jpg',
        mimeType: 'image/jpeg',
        size: 0,
        projectId: project.id,
        uploadedBy: user.id,
        type: 'BEFORE',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }
  );
}

async function assertMigrationState(expectedNames) {
  const rows = await sequelize.query(
    'SELECT "name" FROM "schema_migrations" ORDER BY "name"',
    { type: QueryTypes.SELECT }
  );
  assert(
    JSON.stringify(rows.map((row) => row.name)) === JSON.stringify(expectedNames),
    `Unexpected migration tracking state: ${JSON.stringify(rows)}`
  );
}

async function assertFinalSchema() {
  const description = await sequelize.getQueryInterface().describeTable('files');
  for (const column of ['originalName', 'mimeType', 'size', 'projectId', 'uploadedBy', 'type', 'createdAt', 'updatedAt']) {
    assert(description[column] && description[column].allowNull === false, `${column} is not finalized`);
  }

  const enumRows = await sequelize.query(
    `SELECT e.enumlabel
       FROM pg_type t
       JOIN pg_enum e ON e.enumtypid = t.oid
       JOIN pg_attribute a ON a.atttypid = t.oid
       JOIN pg_class c ON c.oid = a.attrelid
      WHERE c.relname = 'notifications'
        AND a.attname = 'type'`,
    { type: QueryTypes.SELECT }
  );
  assert(enumRows.some((row) => row.enumlabel === 'INVITATION_ACCEPTED'), 'Invitation enum value is missing');

  const foreignKeys = await sequelize.query(
    `SELECT a.attname AS field, rt.relname AS "refTable", c.confdeltype AS "deleteAction"
       FROM pg_constraint c
       JOIN pg_class t ON t.oid = c.conrelid
       JOIN unnest(c.conkey) WITH ORDINALITY AS k(attnum, ord) ON TRUE
       JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
       JOIN pg_class rt ON rt.oid = c.confrelid
      WHERE t.relname = 'files' AND c.contype = 'f'`,
    { type: QueryTypes.SELECT }
  );
  for (const expected of [
    { field: 'projectId', refTable: 'projects', deleteAction: 'r' },
    { field: 'uploadedBy', refTable: 'users', deleteAction: 'r' },
    { field: 'taskId', refTable: 'tasks', deleteAction: 'n' },
    { field: 'reportId', refTable: 'reports', deleteAction: 'n' },
  ]) {
    assert(
      foreignKeys.some((row) => (
        row.field === expected.field
        && row.refTable === expected.refTable
        && row.deleteAction === expected.deleteAction
      )),
      `Unexpected foreign-key behavior for ${expected.field}`
    );
  }
}

async function main() {
  assert(process.env.NODE_ENV === 'test', 'Migration tests require NODE_ENV=test');
  await verifyDestructiveTestDatabase(sequelize);

  try {
    require('../models');
    await sequelize.query('DROP TABLE IF EXISTS "schema_migrations" CASCADE');
    await sequelize.sync({ force: true });
    const fixture = await makeLegacyFixture();
    const migrationNames = getMigrationFiles().map((migration) => migration.name);

    let blocked = false;
    try {
      await migrateUp();
    } catch (error) {
      blocked = /legacy row\(s\) need remediation/.test(error.message);
      if (!blocked) throw error;
    }
    assert(blocked, 'Finalize migration did not block unresolved legacy metadata');
    await assertMigrationState(migrationNames.slice(0, 2));

    await repairLegacyFixture(fixture);
    await migrateUp();
    await migrateUp();
    await migrationStatus();
    await assertMigrationState(migrationNames);
    await assertFinalSchema();
    let rollbackBlocked = false;
    try {
      await migrateDown();
    } catch (error) {
      rollbackBlocked = /rollback is intentionally disabled/.test(error.message);
    }
    assert(rollbackBlocked, 'Unsafe rollback was not rejected');
    await assertMigrationState(migrationNames);
    console.log('Migration test passed: expand/backfill/finalize, enum, idempotency, and failure tracking.');
  } finally {
    await sequelize.drop({ cascade: true });
    await sequelize.close();
    console.log('Dropped verified disposable database schema.');
  }
}

main().catch((error) => {
  console.error(`[migration-test] ${error.message}`);
  process.exitCode = 1;
});
