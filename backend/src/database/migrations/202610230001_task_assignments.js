const { DataTypes, QueryTypes } = require('sequelize');

module.exports = {
  async up({ sequelize, queryInterface, transaction }) {
    await queryInterface.createTable('task_assignments', {
      taskId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: 'tasks', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      assignedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      assignedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
    }, { transaction });

    await sequelize.query(
      `INSERT INTO "task_assignments" ("taskId", "userId", "assignedAt", "assignedBy")
       SELECT t."id", t."assignedTo", COALESCE(t."createdAt", CURRENT_TIMESTAMP), NULL
         FROM "tasks" t
        WHERE t."assignedTo" IS NOT NULL
       ON CONFLICT ("taskId", "userId") DO NOTHING`,
      { type: QueryTypes.INSERT, transaction }
    );

    await queryInterface.changeColumn('tasks', 'assignedTo', {
      type: DataTypes.UUID,
      allowNull: true,
    }, { transaction });
  },

  async down({ queryInterface, transaction }) {
    await queryInterface.dropTable('task_assignments', { transaction });
  },
};
