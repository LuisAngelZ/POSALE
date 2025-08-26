process.env.JWT_SECRET = 'testsecret';

const database = require('../server/config/database');
database.dbPath = ':memory:';
const User = require('../server/models/User');

beforeAll(async () => {
  await database.connect();
});

afterAll(async () => {
  await database.close();
});

test('creates and retrieves a user', async () => {
  const username = 'testuser';
  await User.create({ username, password: '123456', full_name: 'Test User', role: 'admin' });
  const user = await User.findByUsername(username);
  expect(user).toBeDefined();
  expect(user.username).toBe(username);
});
