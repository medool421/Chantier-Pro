const { Sequelize } = require('sequelize');

module.exports = {
  async up({ queryInterface, transaction }) {
    await queryInterface.changeColumn('projects', 'budget', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true,
    }, { transaction });
  },

  async down({ queryInterface, transaction }) {
    await queryInterface.changeColumn('projects', 'budget', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    }, { transaction });
  },
};
