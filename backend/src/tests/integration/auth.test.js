const request = require('supertest');
const app = require('../../app');
const authService = require('../../services/auth.service');
jest.mock('../../services/auth.service');
jest.mock('../../middlewares/auth.middleware', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 1, role: 'user' };
    next();
  }
}));
describe('Auth Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const mockResult = {
        user: {
          id: 1,
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'user'
        },
        tokens: {
          access: { token: 'access_token', expires: '2024-01-01' },
          refresh: { token: 'refresh_token', expires: '2024-01-02' }
        }
      };
      authService.register.mockResolvedValue(mockResult);
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'john@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe'
        });
      // If body parser is missing, this might be 400 or 500 depending on validators
      // If valid, should be 201
      if (res.statusCode !== 201) {
          console.log('Error response body:', res.body);
      }
      
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockResult);
      expect(authService.register).toHaveBeenCalledWith({
          email: 'john@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe'
      });
    });
  });
  describe('POST /api/v1/auth/login', () => {
    it('should login user successfully', async () => {
      const mockResult = {
        user: {
          id: 1,
          email: 'john@example.com',
          name: 'John Doe'
        },
        tokens: {
            access: { token: 'access_token' },
            refresh: { token: 'refresh_token' }
        }
      };
      authService.login.mockResolvedValue(mockResult);
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'john@example.com',
          password: 'password123'
        });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockResult);
      expect(authService.login).toHaveBeenCalledWith('john@example.com', 'password123');
    });
  });
});