# Backend Testing Guide

## Overview

This project uses Jest for comprehensive testing with mocked database connections. Tests are fast, isolated, and don't require a running database. Logger is automatically suppressed during testing for cleaner output.

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

## Test Structure

### Unit Tests (`tests/unit/`)

Unit tests focus on individual functions and modules in isolation:

- **`config.test.ts`**: Tests configuration validation and environment variable parsing
- **`database.test.ts`**: Tests database initialization with mocked MSSQL connections

### Integration Tests (`tests/integration/`)

Integration tests verify how components work together:

- **`health.test.ts`**: Tests API endpoints, middleware, and error handling

## Test Utilities

The `tests/utils.ts` file provides helper functions for testing:

- `createTestApp()`: Creates an Express app with standard middleware
- `addErrorHandling()`: Adds error handling middleware to the app
- `createMockResponse()`: Creates a mock Express response
- `createMockRequest()`: Creates a mock Express request
- `startTestServer()`: Starts a test server and returns cleanup function

## Mocking Strategy

### MSSQL Mocking

MSSQL is globally mocked in `tests/setup.js`:

```javascript
jest.mock('mssql', () => ({
  ConnectionPool: jest.fn(),
  connect: jest.fn(),
  query: jest.fn(),
}));
```

This allows tests to:
- Test error scenarios without a real database
- Run tests in CI/CD environments
- Keep tests fast and isolated
- Verify database error handling

### Example Usage

```typescript
import sql from 'mssql';

const mockedSql = sql as jest.Mocked<typeof sql>;

// Mock successful query
mockedSql.query.mockResolvedValue({
  recordset: [{ test: 1 }],
});

// Mock query failure
mockedSql.query.mockRejectedValue(new Error('Connection failed'));
```

## Environment Variables for Testing

Testing environment variables are set in `tests/setup.js`:

```javascript
process.env.NODE_ENV = 'test';
process.env.DB_USER = 'testuser';
process.env.DB_PASSWORD = 'testpass';
process.env.DB_SERVER = 'localhost';
process.env.DB_NAME = 'testdb';
```

## Best Practices

### 1. Clear Mocks Between Tests

```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```

### 2. Test Error Scenarios

```typescript
it('should handle database errors', async () => {
  mockedSql.query.mockRejectedValue(new Error('Connection failed'));
  // Test error handling
});
```

### 3. Group Related Tests

Use `describe()` blocks to organize tests:

```typescript
describe('Health Check Endpoint', () => {
  it('should return healthy status when connected', async () => {
    // test
  });

  it('should return unhealthy when disconnected', async () => {
    // test
  });
});
```

### 4. Suppress Console Output

Tests suppress console.log and debug output to keep logs clean. Errors are still visible for debugging.

## Common Test Patterns

### Testing API Endpoints

```typescript
const response = await request(app)
  .get('/health')
  .expect(200);

expect(response.body.status).toBe('healthy');
```

### Testing Error Handling

```typescript
mockedSql.query.mockRejectedValue(new Error('DB Error'));

const response = await request(app)
  .get('/health')
  .expect(500);

expect(response.body.error).toBe('DB Error');
```

### Testing Configuration

```typescript
process.env.DB_USER = '';
expect(() => validateConfig()).toThrow('DB_USER is required');
```

## Coverage Goals

- **Statements**: >80%
- **Branches**: >75%
- **Functions**: >80%
- **Lines**: >80%

Run `npm run test:coverage` to check current coverage.

## CI/CD Integration

Tests run automatically in CI/CD pipelines without any database setup required. The mocking strategy ensures:

- Fast test execution (<1 second)
- No external dependencies
- Reliable, deterministic results
- Easy debugging with clear error messages

## Debugging Tests

### Run specific test file
```bash
npm test -- config.test.ts
```

### Run specific test suite
```bash
npm test -- --testNamePattern="Config Validation"
```

### Enable verbose output
```bash
npm test -- --verbose
```

### Debug in Node Inspector
```bash
node --inspect-brk ./node_modules/.bin/jest --runInBand
```

## Troubleshooting

### Tests are slow

This is unusual - tests should complete in <1 second. Check for:
- Unfinished async operations
- Missing `jest.clearAllMocks()` in beforeEach

### Mock not working

Ensure mocks are defined **before** importing the module:

```typescript
jest.mock('mssql', () => ({ /* ... */ }));
import sql from 'mssql'; // Must be after mock
```

### Console output not suppressed

The global console mock might be broken. Check `tests/setup.js` is loaded properly.

## E2E Testing

For end-to-end testing with a real database, use the docker-compose setup:

```bash
docker-compose up
npm run e2e
```

However, unit and integration tests should **not** require docker-compose.
