const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const request = require('supertest');

const app = require('../../server');
const cloudinary = require('../../config/cloudinary');
const { uploadDir } = require('../../utils/fileStorage');
const {
  Company,
  User,
  Project,
  Task,
  File,
  TaskUpdate,
} = require('../../models');
const { signToken } = require('../../utils/jwt');

describe('backend mutation authorization', () => {
  let companyA;
  let companyB;
  let bossA;
  let bossB;
  let managerA;
  let otherManagerA;
  let workerA;
  let workerB;
  let projectA;
  let projectB;
  let taskA;
  let taskB;
  let uploadedFileIds;
  let cloudinaryUploadStream;

  const image = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const createUser = (companyId, role) => User.create({
    firstName: role,
    lastName: crypto.randomUUID(),
    email: `${role}-${crypto.randomUUID()}@example.com`,
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

  const uploadSharedFile = (user, projectId) => request(app)
    .post('/api/files')
    .set('Authorization', auth(user))
    .field('projectId', projectId)
    .field('type', 'ISSUE')
    .attach('file', image, { filename: 'evidence.png', contentType: 'image/png' });

  beforeAll(async () => {
    cloudinaryUploadStream = cloudinary.uploader.upload_stream;
    cloudinary.uploader.upload_stream = (options, callback) => ({
      end: () => callback(null, { secure_url: 'https://example.com/task-update.png' }),
    });

    companyA = await Company.create({ name: `Mutation A ${crypto.randomUUID()}` });
    companyB = await Company.create({ name: `Mutation B ${crypto.randomUUID()}` });
    bossA = await createUser(companyA.id, 'BOSS');
    bossB = await createUser(companyB.id, 'BOSS');
    managerA = await createUser(companyA.id, 'MANAGER');
    otherManagerA = await createUser(companyA.id, 'MANAGER');
    workerA = await createUser(companyA.id, 'WORKER');
    workerB = await createUser(companyB.id, 'WORKER');

    projectA = await Project.create({
      name: 'Mutation project A', bossId: bossA.id, managerId: managerA.id, companyId: companyA.id,
    });
    projectB = await Project.create({
      name: 'Mutation project B', bossId: bossB.id, managerId: workerB.id, companyId: companyB.id,
    });
    taskA = await Task.create({ title: 'Assigned task', projectId: projectA.id, assignedTo: workerA.id });
    taskB = await Task.create({ title: 'Foreign task', projectId: projectB.id, assignedTo: workerA.id });
    uploadedFileIds = [];
  });

  afterAll(async () => {
    cloudinary.uploader.upload_stream = cloudinaryUploadStream;
    const files = await File.findAll({ where: { id: uploadedFileIds } });
    await Promise.all(files.map(async (file) => {
      const storedName = path.basename(file.url);
      await fs.rm(path.join(uploadDir, storedName), { force: true });
    }));
  });

  it('allows only an assigned Worker to create an update with immutable authorship', async () => {
    const allowed = await request(app)
      .post('/api/task-updates')
      .set('Authorization', auth(workerA))
      .field('taskId', taskA.id)
      .field('type', 'DONE')
      .field('message', 'Completed')
      .attach('image', image, { filename: 'update.png', contentType: 'image/png' });

    expect(allowed.statusCode).toBe(201);
    const created = await TaskUpdate.findByPk(allowed.body.data.id);
    expect(created.userId).toBe(workerA.id);
    expect(created.companyId).toBe(companyA.id);

    const unassigned = await request(app)
      .post('/api/task-updates')
      .set('Authorization', auth(workerB))
      .field('taskId', taskA.id)
      .field('type', 'DONE')
      .attach('image', image, { filename: 'update.png', contentType: 'image/png' });
    expect(unassigned.statusCode).toBe(404);

    for (const user of [managerA, bossA]) {
      const denied = await request(app)
        .post('/api/task-updates')
        .set('Authorization', auth(user))
        .field('taskId', taskA.id)
        .field('type', 'DONE')
        .attach('image', image, { filename: 'update.png', contentType: 'image/png' });
      expect(denied.statusCode).toBe(403);
    }

    const crossCompany = await request(app)
      .post('/api/task-updates')
      .set('Authorization', auth(workerA))
      .field('taskId', taskB.id)
      .field('type', 'DONE')
      .attach('image', image, { filename: 'update.png', contentType: 'image/png' });
    expect(crossCompany.statusCode).toBe(404);
  });

  it('scopes shared file uploads and deletion to Boss and assigned Manager projects', async () => {
    const bossUpload = await uploadSharedFile(bossA, projectA.id);
    expect(bossUpload.statusCode).toBe(201);
    uploadedFileIds.push(bossUpload.body.data.id);
    const listed = await request(app)
      .get(`/api/files/projects/${projectA.id}`)
      .set('Authorization', auth(bossA));
    expect(listed.statusCode).toBe(200);
    const downloaded = await request(app)
      .get(`/api/files/${bossUpload.body.data.id}/download`)
      .set('Authorization', auth(managerA));
    expect(downloaded.statusCode).toBe(200);
    const workerDelete = await request(app)
      .delete(`/api/files/${bossUpload.body.data.id}`)
      .set('Authorization', auth(workerA));
    expect(workerDelete.statusCode).toBe(403);
    const bossDelete = await request(app)
      .delete(`/api/files/${bossUpload.body.data.id}`)
      .set('Authorization', auth(bossA));
    expect(bossDelete.statusCode).toBe(204);

    const managerUpload = await uploadSharedFile(managerA, projectA.id);
    expect(managerUpload.statusCode).toBe(201);
    uploadedFileIds.push(managerUpload.body.data.id);
    const managerDelete = await request(app)
      .delete(`/api/files/${managerUpload.body.data.id}`)
      .set('Authorization', auth(managerA));
    expect(managerDelete.statusCode).toBe(204);

    expect((await uploadSharedFile(bossA, projectB.id)).statusCode).toBe(404);
    expect((await uploadSharedFile(managerA, projectB.id)).statusCode).toBe(404);
    expect((await uploadSharedFile(otherManagerA, projectA.id)).statusCode).toBe(404);

    const crossCompanyFile = await File.create({
      url: '/uploads/not-present.png',
      originalName: 'not-present.png',
      mimeType: 'image/png',
      size: image.length,
      type: 'ISSUE',
      projectId: projectB.id,
      uploadedBy: bossB.id,
    });
    const bossCrossCompanyDelete = await request(app)
      .delete(`/api/files/${crossCompanyFile.id}`)
      .set('Authorization', auth(bossA));
    expect(bossCrossCompanyDelete.statusCode).toBe(404);

    const managerUnassignedFile = await File.create({
      url: '/uploads/not-present.png',
      originalName: 'not-present.png',
      mimeType: 'image/png',
      size: image.length,
      type: 'ISSUE',
      projectId: projectA.id,
      uploadedBy: bossA.id,
    });
    const managerUnassignedDelete = await request(app)
      .delete(`/api/files/${managerUnassignedFile.id}`)
      .set('Authorization', auth(otherManagerA));
    expect(managerUnassignedDelete.statusCode).toBe(404);

    const workerUpload = await uploadSharedFile(workerA, projectA.id);
    expect(workerUpload.statusCode).toBe(403);

    const mismatchedTaskParent = await request(app)
      .post('/api/files')
      .set('Authorization', auth(workerA))
      .field('projectId', projectA.id)
      .field('taskId', taskB.id)
      .field('type', 'ISSUE')
      .attach('file', image, { filename: 'foreign-task.png', contentType: 'image/png' });
    expect(mismatchedTaskParent.statusCode).toBe(404);
  });

  it('keeps Worker evidence uploads task-bound and non-deletable as shared files', async () => {
    const response = await request(app)
      .post('/api/files')
      .set('Authorization', auth(workerA))
      .field('projectId', projectA.id)
      .field('taskId', taskA.id)
      .field('type', 'ISSUE')
      .attach('file', image, { filename: 'task-evidence.png', contentType: 'image/png' });

    expect(response.statusCode).toBe(201);
    uploadedFileIds.push(response.body.data.id);

    const deniedDelete = await request(app)
      .delete(`/api/files/${response.body.data.id}`)
      .set('Authorization', auth(bossA));
    expect(deniedDelete.statusCode).toBe(403);
  });
});
