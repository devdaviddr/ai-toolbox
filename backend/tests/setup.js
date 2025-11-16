// Global test setup
process.env.NODE_ENV = 'test';

// Mock environment variables for tests
process.env.DB_USER = 'testuser';
process.env.DB_PASSWORD = 'testpass';
process.env.DB_SERVER = 'localhost';
process.env.DB_NAME = 'testdb';
process.env.PORT = '3001';
process.env.LOG_LEVEL = 'error';

// Mock MSSQL
jest.mock('mssql', () => ({
  ConnectionPool: jest.fn(),
  connect: jest.fn(),
  query: jest.fn(),
}));

// Suppress console output during tests (errors are still visible in Jest output)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  // Keep warn and error for visibility during test debugging
};

// Restore console after all tests
afterAll(() => {
  jest.restoreAllMocks();
});