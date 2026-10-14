const fs = require('fs');
const { QueryTypes, DataTypes } = require('sequelize');
const { resolveStoredPath, detectMimeType } = require('../../utils/fileStorage');

const FILE_COLUMNS = {
  originalName: { type: DataTypes.STRING, allowNull: true },
  mimeType: { type: DataTypes.STRING, allowNull: true },
  size: { type: DataTypes.INTEGER, allowNull: true },
  projectId: { type: DataTypes.UUID, allowNull: true },
  taskId: { type: DataTypes.UUID, allowNull: true },
  reportId: { type: DataTypes.UUID, allowNull: true },
  uploadedBy: { type: DataTypes.UUID, allowNull: true },
  type: {
    type: DataTypes.ENUM('BEFORE', 'AFTER', 'ISSUE'),
    allowNull: true,
  },
  createdAt: { type: DataTypes.DATE, allowNull: true },
  updatedAt: { type: DataTypes.DATE, allowNull: true },
};

async function ensureExpandColumns(queryInterface, transaction) {
  const description = await queryInterface.describeTable('files', { transaction });

  for (const [name, definition] of Object.entries(FILE_COLUMNS)) {
    if (!description[name]) {
      await queryInterface.addColumn('files', name, definition, { transaction });
    }
  }
}

async function backfillInferableMetadata(sequelize, transaction) {
  const rows = await sequelize.query(
    `SELECT "id", "url", "mimeType", "size"
       FROM "files"
      WHERE "mimeType" IS NULL OR "size" IS NULL`,
    { type: QueryTypes.SELECT, transaction }
  );

  for (const row of rows) {
    const storedPath = resolveStoredPath(row.url);
    if (!storedPath) continue;

    let size;
    let mimeType;
    try {
      const contents = await fs.promises.readFile(storedPath);
      const stat = await fs.promises.stat(storedPath);
      size = row.size == null ? stat.size : undefined;
      mimeType = row.mimeType == null ? detectMimeType(contents) : undefined;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      continue;
    }

    if (size == null && mimeType == null) continue;

    const updates = [];
    const replacements = { id: row.id };
    if (size != null) {
      updates.push('"size" = :size');
      replacements.size = size;
    }
    if (mimeType) {
      updates.push('"mimeType" = :mimeType');
      replacements.mimeType = mimeType;
    }

    await sequelize.query(
      `UPDATE "files" SET ${updates.join(', ')} WHERE "id" = :id`,
      { replacements, transaction }
    );
  }
}

async function findUnresolvedFiles(sequelize, transaction) {
  const rows = await sequelize.query(
    `SELECT
       f."id",
       f."originalName",
       f."mimeType",
       f."size",
       f."projectId",
       f."uploadedBy",
       f."type",
       f."createdAt",
       f."updatedAt",
       p."id" AS "projectExists",
       u."id" AS "uploaderExists",
       t."id" AS "taskExists",
       r."id" AS "reportExists"
     FROM "files" f
     LEFT JOIN "projects" p ON p."id" = f."projectId"
     LEFT JOIN "users" u ON u."id" = f."uploadedBy"
     LEFT JOIN "tasks" t ON t."id" = f."taskId"
     LEFT JOIN "reports" r ON r."id" = f."reportId"`,
    { type: QueryTypes.SELECT, transaction }
  );

  return rows.map((row) => {
    const reasons = [];
    if (!row.originalName) reasons.push('originalName');
    if (!row.mimeType) reasons.push('mimeType');
    if (row.size == null || row.size < 0) reasons.push('size');
    if (!row.projectId || !row.projectExists) reasons.push('projectId');
    if (!row.uploadedBy || !row.uploaderExists) reasons.push('uploadedBy');
    if (!['BEFORE', 'AFTER', 'ISSUE'].includes(row.type)) reasons.push('type');
    if (!row.createdAt) reasons.push('createdAt');
    if (!row.updatedAt) reasons.push('updatedAt');
    if (row.taskId && !row.taskExists) reasons.push('taskId reference');
    if (row.reportId && !row.reportExists) reasons.push('reportId reference');
    return { id: row.id, reasons };
  }).filter((row) => row.reasons.length > 0);
}

module.exports = {
  ensureExpandColumns,
  backfillInferableMetadata,
  findUnresolvedFiles,
};
