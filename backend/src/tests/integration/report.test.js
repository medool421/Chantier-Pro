const crypto = require('crypto');
const request = require('supertest');

const app = require('../../server');
const { Company, User, Project, Report } = require('../../models');
const { signToken } = require('../../utils/jwt');

const authHeader = (user) =>
  `Bearer ${signToken({
    id: user.id,
    role: user.role,
    companyId: user.companyId,
  })}`;

describe('Project reports', () => {
  let company;
  let otherCompany;
  let boss;
  let manager;
  let otherManager;
  let otherBoss;
  let assignedProject;
  let unassignedProject;
  let otherCompanyProject;

  beforeAll(async () => {
    company = await Company.create({ name: `Reports ${crypto.randomUUID()}` });
    otherCompany = await Company.create({ name: `Other Reports ${crypto.randomUUID()}` });

    boss = await User.create({
      firstName: 'Report',
      lastName: 'Boss',
      email: `boss-${crypto.randomUUID()}@example.com`,
      passwordHash: 'password-hash',
      role: 'BOSS',
      companyId: company.id,
    });

    manager = await User.create({
      firstName: 'Assigned',
      lastName: 'Manager',
      email: `manager-${crypto.randomUUID()}@example.com`,
      passwordHash: 'password-hash',
      role: 'MANAGER',
      companyId: company.id,
    });

    otherManager = await User.create({
      firstName: 'Other',
      lastName: 'Manager',
      email: `other-manager-${crypto.randomUUID()}@example.com`,
      passwordHash: 'password-hash',
      role: 'MANAGER',
      companyId: company.id,
    });

    otherBoss = await User.create({
      firstName: 'Other',
      lastName: 'Boss',
      email: `other-boss-${crypto.randomUUID()}@example.com`,
      passwordHash: 'password-hash',
      role: 'BOSS',
      companyId: otherCompany.id,
    });

    assignedProject = await Project.create({
      name: 'Assigned project',
      bossId: boss.id,
      managerId: manager.id,
      companyId: company.id,
    });

    unassignedProject = await Project.create({
      name: 'Unassigned project',
      bossId: boss.id,
      companyId: company.id,
    });

    otherCompanyProject = await Project.create({
      name: 'Other company project',
      bossId: otherBoss.id,
      companyId: otherCompany.id,
    });
  });

  it('creates and persists a report with a valid report date', async () => {
    const response = await request(app)
      .post(`/api/projects/${assignedProject.id}/reports`)
      .set('Authorization', authHeader(manager))
      .send({
        type: 'DAILY',
        title: 'Daily progress',
        content: 'The foundation work progressed as planned.',
        reportDate: '2026-10-11',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.reportDate).toBe('2026-10-11');
    expect(response.body.data.userId).toBe(manager.id);

    const report = await Report.findByPk(response.body.data.id);
    expect(report.reportDate).toBe('2026-10-11');
    expect(report.userId).toBe(manager.id);
  });

  it('rejects missing or invalid report data', async () => {
    const missingDate = await request(app)
      .post(`/api/projects/${assignedProject.id}/reports`)
      .set('Authorization', authHeader(manager))
      .send({
        type: 'DAILY',
        title: 'Missing date',
        content: 'This report has no date.',
      });

    expect(missingDate.statusCode).toBe(400);

    const invalidDate = await request(app)
      .post(`/api/projects/${assignedProject.id}/reports`)
      .set('Authorization', authHeader(manager))
      .send({
        type: 'DAILY',
        title: 'Invalid date',
        content: 'This report has an invalid date.',
        reportDate: 'not-a-date',
      });

    expect(invalidDate.statusCode).toBe(400);
  });

  it('lists reports with the expected response shape', async () => {
    const response = await request(app)
      .get(`/api/projects/${assignedProject.id}/reports`)
      .set('Authorization', authHeader(manager));

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data[0]).toEqual(expect.objectContaining({
      reportDate: '2026-10-11',
      title: 'Daily progress',
      user: expect.objectContaining({ id: manager.id }),
    }));
  });

  it('denies a manager access to an unassigned project', async () => {
    const response = await request(app)
      .get(`/api/projects/${unassignedProject.id}/reports`)
      .set('Authorization', authHeader(otherManager));

    expect(response.statusCode).toBe(404);
  });

  it('denies cross-company report access', async () => {
    const response = await request(app)
      .get(`/api/projects/${otherCompanyProject.id}/reports`)
      .set('Authorization', authHeader(boss));

    expect(response.statusCode).toBe(404);
  });

  it('allows the legitimate boss to view company reports', async () => {
    const response = await request(app)
      .get(`/api/projects/${assignedProject.id}/reports`)
      .set('Authorization', authHeader(boss));

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].projectId).toBe(assignedProject.id);
  });
});
