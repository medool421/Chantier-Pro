const { DataTypes, QueryTypes } = require('sequelize');
const { findUnresolvedFiles } = require('./fileMetadata');

const foreignKeys = [
  {
    name: 'files_projectId_fkey',
    field: 'projectId',
    table: 'projects',
    onDelete: 'RESTRICT',
  },
  {
    name: 'files_taskId_fkey',
    field: 'taskId',
    table: 'tasks',
    onDelete: 'SET NULL',
  },
  {
    name: 'files_reportId_fkey',
    field: 'reportId',
    table: 'reports',
    onDelete: 'SET NULL',
  },
  {
    name: 'files_uploadedBy_fkey',
    field: 'uploadedBy',
    table: 'users',
    onDelete: 'RESTRICT',
  },
];

async function getForeignKeys(sequelize, field, transaction) {
  const rows = await sequelize.query(
    `SELECT c.conname AS name,
            rt.relname AS "refTable",
            c.confdeltype AS "deleteAction"
       FROM pg_constraint c
       JOIN pg_class t ON t.oid = c.conrelid
       JOIN unnest(c.conkey) WITH ORDINALITY AS k(attnum, ord) ON TRUE
       JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
       JOIN pg_class rt ON rt.oid = c.confrelid
      WHERE t.relname = 'files' AND c.contype = 'f' AND a.attname = :field`,
    { replacements: { field }, type: QueryTypes.SELECT, transaction }
  );
  return rows;
}

module.exports = {
  async up({ sequelize, queryInterface, transaction }) {
    const unresolved = await findUnresolvedFiles(sequelize, transaction);
    if (unresolved.length > 0) {
      const sample = unresolved.slice(0, 20)
        .map((row) => `${row.id} [${row.reasons.join(', ')}]`)
        .join('; ');
      throw new Error(
        `Cannot finalize files schema: ${unresolved.length} legacy row(s) need remediation. ` +
        `Sample: ${sample}`
      );
    }

    await queryInterface.changeColumn('files', 'originalName', {
      type: DataTypes.STRING,
      allowNull: false,
    }, { transaction });
    await queryInterface.changeColumn('files', 'mimeType', {
      type: DataTypes.STRING,
      allowNull: false,
    }, { transaction });
    await queryInterface.changeColumn('files', 'size', {
      type: DataTypes.INTEGER,
      allowNull: false,
    }, { transaction });
    await queryInterface.changeColumn('files', 'projectId', {
      type: DataTypes.UUID,
      allowNull: false,
    }, { transaction });
    await queryInterface.changeColumn('files', 'uploadedBy', {
      type: DataTypes.UUID,
      allowNull: false,
    }, { transaction });
    await queryInterface.changeColumn('files', 'type', {
      type: DataTypes.ENUM('BEFORE', 'AFTER', 'ISSUE'),
      allowNull: false,
    }, { transaction });
    await queryInterface.changeColumn('files', 'createdAt', {
      type: DataTypes.DATE,
      allowNull: false,
    }, { transaction });
    await queryInterface.changeColumn('files', 'updatedAt', {
      type: DataTypes.DATE,
      allowNull: false,
    }, { transaction });

    for (const foreignKey of foreignKeys) {
      const existing = await getForeignKeys(sequelize, foreignKey.field, transaction);
      if (existing.length > 1) {
        throw new Error(
          `Multiple foreign keys exist for files.${foreignKey.field}; ` +
          'inspect them manually before finalizing the File schema.'
        );
      }
      if (
        existing.length === 1
        && existing[0].refTable === foreignKey.table
        && existing[0].deleteAction === (foreignKey.onDelete === 'SET NULL' ? 'n' : 'r')
      ) continue;

      if (existing.length === 1) {
        await queryInterface.removeConstraint('files', existing[0].name, { transaction });
      }

      await queryInterface.addConstraint('files', {
        fields: [foreignKey.field],
        type: 'foreign key',
        name: foreignKey.name,
        references: { table: foreignKey.table, field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: foreignKey.onDelete,
        transaction,
      });
    }
  },

  async down() {
    throw new Error(
      'File metadata finalize rollback is intentionally disabled; review constraints and data before changing them.'
    );
  },
};
