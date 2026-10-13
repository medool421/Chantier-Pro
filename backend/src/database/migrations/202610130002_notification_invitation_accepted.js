const { QueryTypes } = require('sequelize');

module.exports = {
  async up({ sequelize, transaction }) {
    const rows = await sequelize.query(
      `SELECT t.typname AS "typeName", t.typtype AS "typeKind"
         FROM pg_type t
         JOIN pg_attribute a ON a.atttypid = t.oid
         JOIN pg_class c ON c.oid = a.attrelid
        WHERE c.relname = 'notifications'
          AND a.attname = 'type'
          AND a.attnum > 0
          AND NOT a.attisdropped`,
      { type: QueryTypes.SELECT, transaction }
    );

    if (rows.length !== 1 || rows[0].typeKind !== 'e') {
      throw new Error(
        'notifications.type is not the expected PostgreSQL enum; inspect the database before migrating.'
      );
    }

    const typeName = sequelize.getQueryInterface().quoteIdentifier(rows[0].typeName);
    await sequelize.query(
      `ALTER TYPE ${typeName} ADD VALUE IF NOT EXISTS 'INVITATION_ACCEPTED'`,
      { transaction }
    );
  },

  async down() {
    throw new Error(
      'Notification enum rollback is unsafe because existing rows may use INVITATION_ACCEPTED. ' +
      'Remove or migrate those rows manually before using a reviewed database procedure.'
    );
  },
};
