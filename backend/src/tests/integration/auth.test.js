const request = require('supertest');
const app = require('../../server');

describe('Auth - Register & Login', () => {
  const userPayload = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@test.com',
    password: 'password123',
    role: 'BOSS',
  };

  it('should register a user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(userPayload);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('token');
  });

  it('should login the user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: userPayload.email,
        password: userPayload.password,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(userPayload.email);
  });
});
