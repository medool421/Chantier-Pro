const { DataTypes } = require('sequelize');

module.exports = {
  async up({ queryInterface, transaction }) {
    const tableInfo = await queryInterface.describeTable('reports', { transaction });
    if (!tableInfo.imageUrl) {
      await queryInterface.addColumn('reports', 'imageUrl', {
        type: DataTypes.TEXT,
        allowNull: true,
      }, { transaction });
    }
  },

  async down({ queryInterface, transaction }) {
    const tableInfo = await queryInterface.describeTable('reports', { transaction });
    if (tableInfo.imageUrl) {
      await queryInterface.removeColumn('reports', 'imageUrl', { transaction });
    }
  },
};
