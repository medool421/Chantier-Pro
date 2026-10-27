const path = require('path');
const { Op } = require('sequelize');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { sequelize } = require('../src/config/database');
const { Company, User } = require('../src/models');

async function backfillWorkerCompanies() {
  if (process.env.NODE_ENV === 'test' || process.env.DB_NAME !== 'chantier_db') {
    throw new Error('Refusing to backfill a non-development database');
  }

  await sequelize.authenticate();

  const boss = await User.findOne({ where: { email: 'boss@test.com' }, attributes: ['id', 'companyId'] });
  const manager = await User.findOne({ where: { email: 'manager1@test.com' }, attributes: ['id', 'companyId'] });
  if (!boss && !manager) throw new Error('Could not find boss@test.com or manager1@test.com');

  const companyIds = [...new Set([boss?.companyId, manager?.companyId].filter(Boolean))];
  if (companyIds.length > 1) {
    throw new Error('boss@test.com and manager1@test.com do not identify one shared company');
  }

  let companyId = companyIds[0];
  if (!companyId) {
    const [company] = await Company.findOrCreate({
      where: { name: 'ChantierPro Demo' },
      defaults: { name: 'ChantierPro Demo' },
    });
    companyId = company.id;
    const ownerIds = [boss?.id, manager?.id].filter(Boolean);
    await User.update({ companyId }, { where: { id: { [Op.in]: ownerIds }, companyId: null } });
  }

  const workers = await User.findAll({
    where: { role: 'WORKER', companyId: null },
    attributes: ['id', 'email'],
  });

  if (workers.length) {
    await sequelize.transaction(async (transaction) => {
      await User.update(
        { companyId },
        {
          where: {
            id: { [Op.in]: workers.map((worker) => worker.id) },
            companyId: null,
          },
          transaction,
        }
      );
    });
  }

  console.log(`Backfilled ${workers.length} worker(s) with companyId ${companyId}.`);
}

backfillWorkerCompanies()
  .catch((error) => {
    console.error('Worker company backfill failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
