const crypto = require('crypto');
const request = require('supertest');

const app = require('../../server');
const {
  Company,
  User,
  Project,
  Task,
  Team,
  TeamMember,
} = require('../../models');
const { signToken } = require('../../utils/jwt');

describe('Assignment-scoped authorization', () => {
  let companyA;
  let companyB;
  let bossA;
  let bossB;
  let managerA;
  let otherManagerA;
  let managerB;
  let workerA;
  let otherWorkerA;
  let workerB;
  let projectA;
  let projectWithoutTeam;
  let projectB;
  let taskA;
  let otherTaskA;
  let taskB;
  let teamA;
  let memberA;

  const createUser = (companyId, role, label) => User.create({
    firstName: role,
    lastName: label,
    email: `${label}-${role}-${crypto.randomUUID()}@example.com`,
    passwordHash: 'password-hash',
    role,
    companyId,
    isActive: true,
    status: 'ACTIVE',
  });

  const auth = (user) => `Bearer ${signToken({
    id: user.id,
    role: user.role,
    companyId: user.companyId,
  })}`;

  beforeAll(async () => {
    companyA = await Company.create({ name: `Authorization A ${crypto.randomUUID()}` });
    companyB = await Company.create({ name: `Authorization B ${crypto.randomUUID()}` });

    bossA = await createUser(companyA.id, 'BOSS', 'boss-a');
    bossB = await createUser(companyB.id, 'BOSS', 'boss-b');
    managerA = await createUser(companyA.id, 'MANAGER', 'manager-a');
    otherManagerA = await createUser(companyA.id, 'MANAGER', 'manager-a-2');
    managerB = await createUser(companyB.id, 'MANAGER', 'manager-b');
    workerA = await createUser(companyA.id, 'WORKER', 'worker-a');
    otherWorkerA = await createUser(companyA.id, 'WORKER', 'worker-a-2');
    workerB = await createUser(companyB.id, 'WORKER', 'worker-b');

    projectA = await Project.create({
      name: 'Company A assigned project',
      bossId: bossA.id,
      managerId: managerA.id,
      companyId: companyA.id,
    });
    projectWithoutTeam = await Project.create({
      name: 'Company A project without team',
      bossId: bossA.id,
      managerId: managerA.id,
      companyId: companyA.id,
    });
    projectB = await Project.create({
      name: 'Company B project',
      bossId: bossB.id,
      managerId: managerB.id,
      companyId: companyB.id,
    });

    taskA = await Task.create({
      title: 'Assigned task A',
      projectId: projectA.id,
      assignedTo: workerA.id,
    });
    otherTaskA = await Task.create({
      title: 'Other worker task A',
      projectId: projectA.id,
      assignedTo: otherWorkerA.id,
    });
    taskB = await Task.create({
      title: 'Assigned task B',
      projectId: projectB.id,
      assignedTo: workerB.id,
    });

    teamA = await Team.create({ name: 'Company A team', projectId: projectA.id });
    memberA = await TeamMember.create({
      teamId: teamA.id,
      userId: workerA.id,
      roleInTeam: 'MEMBER',
    });
  });

  it('enforces company and manager assignment on project access', async () => {
    const assigned = await request(app)
      .get(`/api/projects/${projectA.id}`)
      .set('Authorization', auth(managerA));
    expect(assigned.statusCode).toBe(200);

    const otherManager = await request(app)
      .get(`/api/projects/${projectA.id}`)
      .set('Authorization', auth(otherManagerA));
    expect(otherManager.statusCode).toBe(404);

    const otherCompany = await request(app)
      .get(`/api/projects/${projectA.id}`)
      .set('Authorization', auth(managerB));
    expect(otherCompany.statusCode).toBe(404);

    const bossOtherCompany = await request(app)
      .get(`/api/projects/${projectA.id}`)
      .set('Authorization', auth(bossB));
    expect(bossOtherCompany.statusCode).toBe(404);
  });

  it('rejects cross-company manager assignment', async () => {
    const response = await request(app)
      .patch(`/api/projects/${projectA.id}/assign-manager`)
      .set('Authorization', auth(bossA))
      .send({ managerId: managerB.id });

    expect(response.statusCode).toBe(400);
  });

  it('authorizes project teams through the parent project', async () => {
    const legitimate = await request(app)
      .get(`/api/projects/${projectA.id}/team`)
      .set('Authorization', auth(managerA));
    expect(legitimate.statusCode).toBe(200);

    const unauthorized = await request(app)
      .get(`/api/projects/${projectA.id}/team`)
      .set('Authorization', auth(bossB));
    expect(unauthorized.statusCode).toBe(404);

    const createUnauthorized = await request(app)
      .post('/api/teams')
      .set('Authorization', auth(managerB))
      .send({ name: 'Unauthorized team', projectId: projectWithoutTeam.id });
    expect(createUnauthorized.statusCode).toBe(404);
  });

  it('protects team mutation and membership operations', async () => {
    const updateUnauthorized = await request(app)
      .put(`/api/teams/${teamA.id}`)
      .set('Authorization', auth(bossB))
      .send({ name: 'Stolen team' });
    expect(updateUnauthorized.statusCode).toBe(404);

    const deleteUnauthorized = await request(app)
      .delete(`/api/teams/${teamA.id}`)
      .set('Authorization', auth(bossB));
    expect(deleteUnauthorized.statusCode).toBe(404);

    const removeUnauthorized = await request(app)
      .delete(`/api/teams/${teamA.id}/members/${workerA.id}`)
      .set('Authorization', auth(bossB));
    expect(removeUnauthorized.statusCode).toBe(404);

    const addCrossCompany = await request(app)
      .post(`/api/teams/${teamA.id}/members`)
      .set('Authorization', auth(bossA))
      .send({ userId: workerB.id, roleInTeam: 'MEMBER' });
    expect(addCrossCompany.statusCode).toBe(404);

    const memberStillExists = await TeamMember.findByPk(memberA.id);
    expect(memberStillExists).not.toBeNull();
  });

  it('allows assigned manager team creation', async () => {
    const response = await request(app)
      .post('/api/teams')
      .set('Authorization', auth(managerA))
      .send({ name: 'Legitimate team', projectId: projectWithoutTeam.id });

    expect(response.statusCode).toBe(201);
  });

  it('restricts task operations to the assigned manager project', async () => {
    const allowed = await request(app)
      .get(`/api/tasks/${taskA.id}`)
      .set('Authorization', auth(managerA));
    expect(allowed.statusCode).toBe(200);

    const deniedRead = await request(app)
      .get(`/api/tasks/${taskA.id}`)
      .set('Authorization', auth(otherManagerA));
    expect(deniedRead.statusCode).toBe(404);

    const deniedCreate = await request(app)
      .post(`/api/projects/${projectA.id}/tasks`)
      .set('Authorization', auth(otherManagerA))
      .send({ title: 'Unauthorized task' });
    expect(deniedCreate.statusCode).toBe(404);

    const deniedUpdate = await request(app)
      .put(`/api/tasks/${taskA.id}`)
      .set('Authorization', auth(otherManagerA))
      .send({ title: 'Unauthorized task update' });
    expect(deniedUpdate.statusCode).toBe(404);

    const deniedStatus = await request(app)
      .patch(`/api/tasks/${taskA.id}/status`)
      .set('Authorization', auth(otherManagerA))
      .send({ status: 'COMPLETED' });
    expect(deniedStatus.statusCode).toBe(404);

    const deniedDelete = await request(app)
      .delete(`/api/tasks/${taskA.id}`)
      .set('Authorization', auth(otherManagerA));
    expect(deniedDelete.statusCode).toBe(404);

    const crossCompany = await request(app)
      .get(`/api/tasks/${taskB.id}`)
      .set('Authorization', auth(managerA));
    expect(crossCompany.statusCode).toBe(404);
  });

  it('requires same-company active workers for task assignment', async () => {
    const response = await request(app)
      .post(`/api/projects/${projectA.id}/tasks`)
      .set('Authorization', auth(managerA))
      .send({ title: 'Cross-company assignment', assignedTo: workerB.id });

    expect(response.statusCode).toBe(404);
  });

  it('restricts workers to their own task and task updates', async () => {
    const deniedRead = await request(app)
      .get(`/api/tasks/${otherTaskA.id}`)
      .set('Authorization', auth(workerA));
    expect(deniedRead.statusCode).toBe(403);

    const deniedStatus = await request(app)
      .patch(`/api/tasks/${otherTaskA.id}/status`)
      .set('Authorization', auth(workerA))
      .send({ status: 'COMPLETED' });
    expect(deniedStatus.statusCode).toBe(403);

    const deniedUpdate = await request(app)
      .post('/api/task-updates')
      .set('Authorization', auth(workerA))
      .field('taskId', otherTaskA.id)
      .field('type', 'DONE')
      .field('message', 'Unauthorized progress');
    expect(deniedUpdate.statusCode).toBe(403);

    const deniedUpdateRead = await request(app)
      .get(`/api/tasks/${otherTaskA.id}/updates`)
      .set('Authorization', auth(workerA));
    expect(deniedUpdateRead.statusCode).toBe(403);

    const deniedFileUpload = await request(app)
      .post('/api/files')
      .set('Authorization', auth(workerA))
      .field('projectId', projectA.id)
      .field('type', 'ISSUE')
      .field('taskId', otherTaskA.id)
      .attach('file', Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), {
        filename: 'unauthorized.png',
        contentType: 'image/png',
      });
    expect(deniedFileUpload.statusCode).toBe(403);

    const ownUpdate = await request(app)
      .post('/api/task-updates')
      .set('Authorization', auth(workerA))
      .field('taskId', taskA.id)
      .field('type', 'DONE')
      .field('message', 'Own progress without image');
    expect(ownUpdate.statusCode).toBe(400);
    expect(ownUpdate.body.message).toBe('Image is required');
  });
});
