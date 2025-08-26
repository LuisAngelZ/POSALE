process.env.JWT_SECRET = 'testsecret';

const database = require('../server/config/database');
database.dbPath = ':memory:';
const app = require('../server/app');
const request = require('supertest');
const User = require('../server/models/User');

beforeAll(async () => {
  await database.connect();
  await User.create({ username: 'admin', password: '123456', full_name: 'Admin User', role: 'admin' });
});

afterAll(async () => {
  await database.close();
});

test('login and verify token', async () => {
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: '123456' });
  expect(loginRes.status).toBe(200);
  expect(loginRes.body.token).toBeDefined();

  const verifyRes = await request(app)
    .post('/api/auth/verify-token')
    .set('Authorization', `Bearer ${loginRes.body.token}`);
  expect(verifyRes.status).toBe(200);
  expect(verifyRes.body.user.username).toBe('admin');
});
