const fs = require('fs');
const path = require('path');
const { DataTypes, QueryTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const migrationsDirectory = path.resolve(__dirname, 'migrations');
const trackingTable = 'schema_migrations';
const migrationLockKey = 'chantierpro:schema-migrations';

function getMigrationFiles() {
  return fs.readdirSync(migrationsDirectory)
    .filter((file) => /^\d+_.+\.js$/.test(file))
    .sort()
    .map((file) => ({ name: file, module: require(path.join(migrationsDirectory, file)) }));
}

async function ensureTrackingTable(queryInterface, transaction) {
  const exists = await trackingTableExists(queryInterface, transaction);

  if (!exists) {
    await queryInterface.createTable(trackingTable, {
      name: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
      appliedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, { transaction });
  }
}

async function trackingTableExists(queryInterface, transaction) {
  const tables = await queryInterface.showAllTables({ transaction });
  return tables.some((table) => {
    const name = typeof table === 'string' ? table : table.tableName;
    return name === trackingTable;
  });
}

async function getAppliedMigrations(transaction, sequelizeInstance = sequelize) {
  return sequelizeInstance.query(
    `SELECT "name", "appliedAt" FROM "${trackingTable}" ORDER BY "appliedAt", "name"`,
    { type: QueryTypes.SELECT, transaction }
  );
}

async function getMigrationStatusSnapshot(queryInterface, transaction, sequelizeInstance = sequelize) {
  const exists = await trackingTableExists(queryInterface, transaction);
  if (!exists) return new Map();
  return new Map((await getAppliedMigrations(transaction, sequelizeInstance)).map((row) => [row.name, row.appliedAt]));
}

async function withMigrationLock(callback) {
  await sequelize.query('SELECT pg_advisory_lock(hashtext(:key))', {
    replacements: { key: migrationLockKey },
  });
  try {
    return await callback();
  } finally {
    await sequelize.query('SELECT pg_advisory_unlock(hashtext(:key))', {
      replacements: { key: migrationLockKey },
    });
  }
}

async function migrateUp() {
  return withMigrationLock(async () => {
    await sequelize.authenticate();
    const queryInterface = sequelize.getQueryInterface();
    await ensureTrackingTable(queryInterface);
    const applied = new Set((await getAppliedMigrations()).map((row) => row.name));

    for (const migration of getMigrationFiles()) {
      if (applied.has(migration.name)) continue;

      await sequelize.transaction(async (transaction) => {
        await migration.module.up({ sequelize, queryInterface, transaction });
        await queryInterface.bulkInsert(
          trackingTable,
          [{ name: migration.name, appliedAt: new Date() }],
          { transaction }
        );
      });
      console.log(`Applied ${migration.name}`);
    }
  });
}

async function migrationStatus() {
  return withMigrationLock(async () => {
    await sequelize.authenticate();
    const queryInterface = sequelize.getQueryInterface();
    const applied = await getMigrationStatusSnapshot(queryInterface);

    for (const migration of getMigrationFiles()) {
      const value = applied.get(migration.name);
      console.log(`${value ? 'applied' : 'pending'}\t${migration.name}${value ? `\t${value.toISOString()}` : ''}`);
    }
  });
}

async function migrateDown() {
  return withMigrationLock(async () => {
    await sequelize.authenticate();
    const queryInterface = sequelize.getQueryInterface();
    await ensureTrackingTable(queryInterface);
    const applied = await getAppliedMigrations();
    if (applied.length === 0) {
      console.log('No applied migrations.');
      return;
    }

    const last = applied[applied.length - 1];
    const migration = getMigrationFiles().find((item) => item.name === last.name);
    if (!migration || typeof migration.module.down !== 'function') {
      throw new Error(`No safe down migration is defined for ${last.name}`);
    }

    await sequelize.transaction(async (transaction) => {
      await migration.module.down({ sequelize, queryInterface, transaction });
      await queryInterface.bulkDelete(trackingTable, { name: last.name }, { transaction });
    });
    console.log(`Reverted ${last.name}`);
  });
}

async function main() {
  const command = process.argv[2] || 'up';
  if (command === 'status') await migrationStatus();
  else if (command === 'up') await migrateUp();
  else if (command === 'down') await migrateDown();
  else throw new Error(`Unknown migration command: ${command}`);
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(`[migration] ${error.message}`);
      process.exitCode = 1;
    })
    .finally(() => sequelize.close());
}

module.exports = {
  migrateUp,
  migrateDown,
  migrationStatus,
  ensureTrackingTable,
  trackingTableExists,
  getMigrationStatusSnapshot,
  getMigrationFiles,
};
