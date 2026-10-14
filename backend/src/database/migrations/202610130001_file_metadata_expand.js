const { ensureExpandColumns, backfillInferableMetadata, findUnresolvedFiles } = require('./fileMetadata');

module.exports = {
  async up({ sequelize, queryInterface, transaction }) {
    await ensureExpandColumns(queryInterface, transaction);
    await backfillInferableMetadata(sequelize, transaction);

    const unresolved = await findUnresolvedFiles(sequelize, transaction);
    if (unresolved.length > 0) {
      console.warn(
        `[migration] File metadata remains unresolved for ${unresolved.length} row(s); ` +
        'the finalize migration will remain blocked until operators remediate them.'
      );
    }
  },

  async down() {
    throw new Error(
      'File metadata expand migration is irreversible: dropping columns could destroy legacy data. ' +
      'Restore a database backup instead.'
    );
  },
};
