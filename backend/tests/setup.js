// Global test setup
process.env.NODE_ENV = 'test';

// Mock environment variables for tests
process.env.DB_USER = 'testuser';
process.env.DB_PASSWORD = 'testpass';
process.env.DB_SERVER = 'localhost';
process.env.DB_NAME = 'testdb';
process.env.PORT = '3001';
process.env.LOG_LEVEL = 'error';

// Azure AD test configuration - using valid UUIDs
process.env.AZURE_CLIENT_ID = '550e8400-e29b-41d4-a716-446655440000';
process.env.AZURE_TENANT_ID = '550e8400-e29b-41d4-a716-446655440001';
process.env.AZURE_AUDIENCE = 'api://550e8400-e29b-41d4-a716-446655440000';
process.env.AZURE_AUDIENCE_WITH_SCOPE = 'api://550e8400-e29b-41d4-a716-446655440000';
process.env.AZURE_ISSUER = 'https://login.microsoftonline.com/550e8400-e29b-41d4-a716-446655440001/v2.0';

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