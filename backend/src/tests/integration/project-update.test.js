const crypto = require('crypto');
const request = require('supertest');

const app = require('../../server');
const { Company, User, Project, Task } = require('../../models');
const { signToken } = require('../../utils/jwt');

describe('Project update', () => {
  let boss;
  let project;
  let otherUser;

  beforeAll(async () => {
    const company = await Company.create({ name: `Update Test ${crypto.randomUUID()}` });
    const otherCompany = await Company.create({ name: `Other Test ${crypto.randomUUID()}` });

    boss = await User.create({
      firstName: 'Project',
      lastName: 'Owner',
      email: `owner-${crypto.randomUUID()}@example.com`,
      passwordHash: 'password-hash',
      role: 'BOSS',
      companyId: company.id,
    });

    otherUser = await User.create({
      firstName: 'Other',
      lastName: 'User',
      email: `other-${crypto.randomUUID()}@example.com`,
      passwordHash: 'password-hash',
      role: 'BOSS',
      companyId: otherCompany.id,
    });

    project = await Project.create({
      name: 'Original project name',
      bossId: boss.id,
      companyId: company.id,
    });

    await Task.create({
      title: 'Completed task',
      projectId: project.id,
      status: 'COMPLETED',
    });

    await Task.create({
      title: 'Open task',
      projectId: project.id,
      status: 'TODO',
    });
  });

  it('updates the project and returns enriched progress data', async () => {
    const response = await request(app)
      .put(`/api/projects/${project.id}`)
      .set('Authorization', `Bearer ${signToken({
        id: boss.id,
        role: boss.role,
        companyId: boss.companyId,
      })}`)
      .send({ name: 'Updated project name' });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('Updated project name');
    expect(response.body.data.progressPercentage).toBe(50);
  });

  it('denies project update access to a non-owner user', async () => {
    const protectedProject = await Project.create({
      name: 'Protected project',
      bossId: boss.id,
      companyId: boss.companyId,
    });

    const response = await request(app)
      .put(`/api/projects/${protectedProject.id}`)
      .set('Authorization', `Bearer ${signToken({
        id: otherUser.id,
        role: otherUser.role,
        companyId: otherUser.companyId,
      })}`)
      .send({ name: 'Unauthorized update' });

    expect(response.statusCode).toBe(404);

    const unchangedProject = await Project.findByPk(protectedProject.id);
    expect(unchangedProject.name).toBe('Protected project');
  });
});
