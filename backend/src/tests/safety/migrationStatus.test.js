const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const { getMigrationStatusSnapshot } = require('../../database/migrate');

describe('migration status snapshot', () => {
  test('does not query or create tracking data when the tracking table is absent', async () => {
    const queryInterface = {
      showAllTables: jest.fn(() => Promise.resolve([])),
      createTable: jest.fn(),
    };
    const sequelize = {
      query: jest.fn(),
    };

    const snapshot = await getMigrationStatusSnapshot(queryInterface, undefined, sequelize);

    expect(snapshot).toEqual(new Map());
    expect(queryInterface.createTable).not.toHaveBeenCalled();
    expect(sequelize.query).not.toHaveBeenCalled();
  });
});
