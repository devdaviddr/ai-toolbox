# Testing Architecture & Strategy

Comprehensive guide to understanding how testing works in this project.

## 📖 Table of Contents

- [Overview](#overview)
- [Testing Philosophy](#testing-philosophy)
- [Backend Testing](#backend-testing)
- [Frontend Testing](#frontend-testing)
- [Testing Pyramid](#testing-pyramid)
- [Mocking Strategy](#mocking-strategy)
- [Test Organization](#test-organization)
- [Coverage Goals](#coverage-goals)
- [CI/CD Integration](#cicd-integration)
- [Debugging Tests](#debugging-tests)

---

## 🎯 Overview

This project uses a **comprehensive testing strategy** with multiple layers of testing:

| Type | Tool | Coverage | Speed | Database |
|------|------|----------|-------|----------|
| Unit Tests | Jest | High | ⚡ <1s | Mocked |
| Integration Tests | Jest/Supertest | Medium | ⚡ <1s | Mocked |
| Component Tests | Vitest/RTL | Medium | ⚡ <1s | N/A |
| E2E Tests | Playwright | Low | 🐢 ~30s | Real |

### Quick Stats

**Backend:**
- 31 tests passing
- 83.72% statement coverage
- 0.3 seconds execution time
- Zero external dependencies

**Frontend:**
- 8 tests passing
- Component error boundaries covered
- Hooks integration tested
- Proper Vitest setup

---

## 🧠 Testing Philosophy

We follow these core principles:

### 1. **Isolation First**
Each test is completely independent and doesn't affect others.

```typescript
beforeEach(() => {
  jest.clearAllMocks();  // Fresh mocks for each test
});
```

### 2. **Mock External Dependencies**
Database, APIs, and external services are mocked to keep tests fast.

```typescript
jest.mock('mssql', () => ({
  ConnectionPool: jest.fn(),
  connect: jest.fn(),
  query: jest.fn(),
}));
```

### 3. **Test Behavior, Not Implementation**
Tests verify what the code does, not how it does it.

```typescript
// ✅ Good: Tests behavior
it('should return health status when connected', async () => {
  const response = await request(app).get('/health').expect(200);
  expect(response.body.status).toBe('healthy');
});

// ❌ Avoid: Tests implementation details
it('should call pool.connect()', async () => {
  // Tests are too tightly coupled to implementation
});
```

### 4. **No Database for Unit/Integration Tests**
Real database testing happens only in E2E layer.

```typescript
// Test setup - fully mocked
jest.mock('mssql', () => ({
  ConnectionPool: jest.fn(),  // ← No real database needed
}));
```

### 5. **Clear Test Names**
Test names describe what is being tested and what should happen.

```typescript
describe('Config Validation', () => {
  it('should require DB_USER to be non-empty', () => {
    // Clear intent: what should happen if DB_USER is empty
  });
});
```

---

## 🔧 Backend Testing

### Architecture

```
backend/tests/
├── setup.js                          # Global configuration
├── utils.ts                          # Reusable helpers
├── unit/
│   ├── config.test.ts               # Configuration tests (14 tests)
│   └── database.test.ts             # Database operations (8 tests)
└── integration/
    └── health.test.ts               # API endpoints (9 tests)
```

### Test Utilities (`tests/utils.ts`)

Helper functions that reduce boilerplate:

```typescript
// Create a test Express app with middleware
const app = createTestApp();

// Add error handling middleware
addErrorHandling(app);

// Mock request/response
const mockReq = createMockRequest({ method: 'POST' });
const mockRes = createMockResponse();

// Start test server
const { server, port, close } = await startTestServer(app);
await close();
```

### Unit Tests

#### Config Validation (`tests/unit/config.test.ts`)

Tests the configuration validation module:

```typescript
describe('Config Validation', () => {
  it('should validate required environment variables', () => {
    const config = validateConfig();
    expect(config.DB_USER).toBe('testuser');
  });

  it('should throw error if DB_USER is empty', () => {
    process.env.DB_USER = '';
    expect(() => validateConfig()).toThrow('DB_USER is required');
  });

  it('should accept valid NODE_ENV values', () => {
    process.env.NODE_ENV = 'production';
    expect(() => validateConfig()).not.toThrow();
  });
});
```

**Coverage:** 14 tests covering:
- ✅ Configuration parsing
- ✅ Environment variable validation
- ✅ Default values
- ✅ Error messages
- ✅ Type safety

#### Database Operations (`tests/unit/database.test.ts`)

Tests the database initialization module:

```typescript
describe('Database Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should connect to database successfully', async () => {
    const mockPool = {
      connect: jest.fn().mockResolvedValue(undefined),
      request: jest.fn().mockReturnValue({
        query: jest.fn().mockResolvedValue(undefined),
      }),
      close: jest.fn().mockResolvedValue(undefined),
    };

    mockedSql.ConnectionPool.mockImplementation(() => mockPool as any);
    await initializeDatabase();

    expect(mockPool.connect).toHaveBeenCalled();
    expect(mockPool.close).toHaveBeenCalled();
  });

  it('should handle connection errors gracefully', async () => {
    const mockPool = {
      connect: jest.fn().mockRejectedValue(new Error('Connection failed')),
    };

    mockedSql.ConnectionPool.mockImplementation(() => mockPool as any);
    await expect(initializeDatabase()).resolves.toBeUndefined();
    // Error caught and handled, no throw
  });
});
```

**Coverage:** 8 tests covering:
- ✅ Successful initialization
- ✅ Connection error handling
- ✅ Query error handling
- ✅ SQL configuration verification
- ✅ Pool lifecycle management

### Integration Tests

#### API Endpoints (`tests/integration/health.test.ts`)

Tests API routes with mocked database:

```typescript
describe('API Endpoints - Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createTestApp();
    app.get('/health', checkHealth);
    addErrorHandling(app);
  });

  describe('Health Check Endpoint', () => {
    it('should return health status when database connected', async () => {
      // Mock successful database response
      mockedSql.query.mockResolvedValue({
        recordset: [{ test: 1 }],
      });

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.database).toBe('connected');
    });

    it('should handle database errors', async () => {
      // Mock database failure
      mockedSql.query.mockRejectedValue(
        new Error('Connection timeout')
      );

      const response = await request(app)
        .get('/health')
        .expect(500);

      expect(response.body.status).toBe('unhealthy');
      expect(response.body.error).toBe('Connection timeout');
    });
  });
});
```

**Coverage:** 9 tests covering:
- ✅ Endpoint responses (healthy/unhealthy)
- ✅ Error handling
- ✅ 404 responses
- ✅ JSON parsing
- ✅ CORS middleware
- ✅ HTTP methods

### Global Setup (`tests/setup.js`)

Configures testing environment:

```javascript
// Set test environment
process.env.NODE_ENV = 'test';

// Mock environment variables
process.env.DB_USER = 'testuser';
process.env.DB_SERVER = 'localhost';

// Mock MSSQL completely
jest.mock('mssql', () => ({
  ConnectionPool: jest.fn(),
  connect: jest.fn(),
  query: jest.fn(),
}));

// Suppress console output in tests
global.console = {
  ...console,
  log: jest.fn(),    // Suppress info logs
  debug: jest.fn(),  // Suppress debug logs
  // Keep error for debugging if needed
};
```

---

## 🎨 Frontend Testing

### Architecture

```
frontend/tests/
└── components/
    └── __tests__/
        └── ErrorBoundary.test.tsx   # Error boundary tests (6 tests)

frontend/hooks/
└── __tests__/
    └── useHealth.test.ts           # Hook tests (2 tests)

frontend/e2e/
└── health.spec.ts                  # Playwright E2E tests
```

### Component Tests

#### ErrorBoundary Tests (`src/components/__tests__/ErrorBoundary.test.tsx`)

Tests the error boundary component:

```typescript
describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
  });

  afterEach(() => {
    cleanup();
  });

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should render fallback UI when error occurs', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should show error details in development', () => {
    vi.stubEnv('NODE_ENV', 'development');

    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error Details (Dev)')).toBeInTheDocument();
  });
});
```

**Coverage:** 6 tests covering:
- ✅ Normal rendering (no errors)
- ✅ Error fallback UI
- ✅ Custom fallback components
- ✅ Dev vs production error display
- ✅ Error lifecycle methods

### Hook Tests

#### useHealth Hook Tests (`src/hooks/__tests__/useHealth.test.ts`)

Tests custom React hook:

```typescript
describe('useHealth Hook', () => {
  it('should fetch health status on mount', async () => {
    const { result } = renderHook(() => useHealth());

    expect(result.current.isLoading).toBe(true);

    // Wait for async operation
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({
      status: 'healthy',
      database: 'connected',
    });
  });

  it('should handle fetch errors', async () => {
    // Mock failed API request
    global.fetch = jest.fn().mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => useHealth());

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
  });
});
```

**Coverage:** 2 tests covering:
- ✅ Successful data fetching
- ✅ Error handling

### Vitest Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['node_modules/**', 'e2e/**'],  // Exclude node_modules and E2E
  },
});
```

---

## 📊 Testing Pyramid

Our testing follows the **testing pyramid** principle:

```
        ▲
       ╱ ╲          E2E Tests (Slow, Expensive)
      ╱   ╲         - Full app testing
     ╱─────╲        - Real database
    ╱       ╲       - ~30 seconds
   ╱─────────╲
  ╱         ╲      Integration Tests (Medium)
 ╱───────────╲     - Mocked dependencies
╱             ╲    - Fast
╱───────────────╲  ─────────────────────
   Unit Tests     Unit Tests (Fast, Cheap)
   (Many!)        - Single functions
                  - Mocked database
                  - <1 second

Ratio: 70% unit, 20% integration, 10% E2E
```

**Our Pyramid:**

```
31 Tests Total
├─ 22 Unit Tests (71%) ─────────────────── Fast ⚡
├─ 9 Integration Tests (29%) ───────────── Medium ⚡
└─ 8 Frontend Component Tests (100%) ───── Fast ⚡
```

---

## 🎭 Mocking Strategy

### Why We Mock the Database

**Backend tests use completely mocked MSSQL:**

| Aspect | Mocked | Real |
|--------|--------|------|
| Speed | ⚡ <1s | 🐢 5-10s |
| Reliability | Deterministic | Flaky |
| Setup | None | Docker required |
| CI/CD | Works anywhere | Needs services |
| Error testing | Easy | Complex |

### How Database Mocking Works

```typescript
// 1. Mock MSSQL module globally
jest.mock('mssql', () => ({
  ConnectionPool: jest.fn(),
  connect: jest.fn(),
  query: jest.fn(),
}));

// 2. Import mocked module
import sql from 'mssql';
const mockedSql = sql as jest.Mocked<typeof sql>;

// 3. Configure mock for each test
beforeEach(() => {
  const mockPool = {
    connect: jest.fn().mockResolvedValue(undefined),
    request: jest.fn().mockReturnValue({
      query: jest.fn().mockResolvedValue({
        recordset: [{ test: 1 }],
      }),
    }),
    close: jest.fn().mockResolvedValue(undefined),
  };

  mockedSql.ConnectionPool.mockImplementation(() => mockPool as any);
});

// 4. Test with mocked behavior
it('should handle query response', async () => {
  const result = await executeQuery();
  expect(result).toEqual([{ test: 1 }]);
});
```

### Mocking Scenarios

**Successful Connection:**
```typescript
mockPool.connect.mockResolvedValue(undefined);
// Connection succeeds
```

**Connection Failure:**
```typescript
mockPool.connect.mockRejectedValue(new Error('Connection failed'));
// Connection fails, error is caught
```

**Query Success:**
```typescript
mockPool.request().query.mockResolvedValue({
  recordset: [{ id: 1, name: 'test' }],
});
// Query returns data
```

**Query Timeout:**
```typescript
mockPool.request().query.mockRejectedValue(
  new Error('Connection timeout')
);
// Query fails with timeout error
```

---

## 📂 Test Organization

### By Type (How We Organize)

```
tests/
├── unit/              # Single function tests
│   ├── config.test.ts
│   └── database.test.ts
└── integration/       # Component interaction tests
    └── health.test.ts
```

### By Feature (How You Might Think)

```
Feature: Configuration
├─ Unit: validateConfig()
└─ Integration: Config used in server startup

Feature: Database
├─ Unit: initializeDatabase()
└─ Integration: Database queries in health check

Feature: Health Check
├─ Integration: /health endpoint
└─ E2E: Full health check flow
```

### Test File Naming

```
[feature].test.ts  or  [feature].spec.ts

config.test.ts          ✅ Good
config.spec.ts          ✅ Also good
configTest.ts           ❌ Avoid
config-test.ts          ❌ Avoid
test-config.ts          ❌ Avoid
```

---

## 📈 Coverage Goals

### Current Coverage

```
Backend:
├─ Statements: 83.72% ✅
├─ Functions:  80%    ✅
├─ Lines:      82.5%  ✅
└─ Branches:   50%    ⚠️ (Needs improvement)

Frontend:
├─ ErrorBoundary: High coverage ✅
└─ Hooks:         Medium coverage ⚠️
```

### Coverage Thresholds (jest.config.cjs)

```javascript
coverageThreshold: {
  global: {
    branches: 75,      // Must cover 75% of branches
    functions: 80,     // Must cover 80% of functions
    lines: 80,         // Must cover 80% of lines
    statements: 80,    // Must cover 80% of statements
  },
}
```

### Improving Coverage

**What's Uncovered:**
- Logger transport setup (file logging)
- Error handling edge cases
- Some branch conditions

**How to Improve:**
```bash
# Generate HTML coverage report
npm run test:coverage

# Open in browser
open coverage/index.html  # macOS
# or start-safari coverage/index.html on Windows
```

**Red areas in report** = uncovered code

---

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Backend Tests
        run: cd backend && npm install && npm test
      
      - name: Frontend Tests
        run: cd frontend && npm install && npm test
      
      - name: Coverage
        run: cd backend && npm run test:coverage
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
```

### Benefits

- ✅ Automatic test runs on every push
- ✅ Prevents broken code from merging
- ✅ Coverage tracking over time
- ✅ Fast feedback (tests run in parallel)

---

## 🐛 Debugging Tests

### Run Single Test

```bash
# By file
npm test -- config.test.ts

# By pattern
npm test -- --testNamePattern="Config"
npm test -- --testNamePattern="should validate"

# Watch mode for specific file
npm test -- --watch config.test.ts
```

### Verbose Output

```bash
# Show all console logs from tests
npm test -- --verbose

# Show which tests are running
npm test -- --listTests
```

### Debug Specific Test

```typescript
it.only('should validate config', () => {
  // Only this test runs
  const config = validateConfig();
  expect(config).toBeDefined();
});

// After debugging, remove .only before committing!
```

### Use Console Logs

```typescript
it('should process data correctly', () => {
  const data = processData(input);
  console.log('Processed:', data);  // Will show in test output
  expect(data).toEqual(expected);
});

// Run with verbose flag to see logs
npm test -- --verbose
```

### Node Inspector Debugging

```bash
# Run tests with debugger
node --inspect-brk ./node_modules/.bin/jest --runInBand

# Open chrome://inspect in Chrome
# Click "inspect" on the test process
# Use DevTools to debug
```

### VSCode Debugging

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/backend/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

Then press F5 to debug!

---

## 📋 Common Test Patterns

### Testing Async Functions

```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### Testing Error Cases

```typescript
it('should throw error on invalid input', () => {
  expect(() => {
    validateConfig();
  }).toThrow('Configuration validation failed');
});
```

### Testing with Mocks

```typescript
it('should call external service', async () => {
  const mock = jest.fn().mockResolvedValue({ data: 'test' });
  const result = await callService();
  expect(mock).toHaveBeenCalledWith(expectedArgs);
});
```

### Testing Express Routes

```typescript
it('should return 200 on valid request', async () => {
  const response = await request(app)
    .get('/health')
    .expect(200);
  
  expect(response.body.status).toBe('healthy');
});
```

---

## ✅ Best Practices

1. **Keep tests focused** - One concept per test
2. **Use descriptive names** - Test name should explain what it tests
3. **Clear arrange-act-assert** - Setup, execute, verify
4. **Mock external dependencies** - Don't test external services
5. **Don't test framework** - Test your code, not React/Express
6. **Isolated tests** - No test should affect another
7. **Avoid test interdependency** - Run tests in any order
8. **DRY up tests** - Use beforeEach for common setup
9. **Test behavior, not implementation** - Focus on outputs
10. **Keep tests simple** - Complex tests are hard to maintain

---

## 🚀 Summary

Our testing strategy provides:

✅ **Fast Feedback** - Tests run in <1 second  
✅ **Reliable** - No flaky tests or external dependencies  
✅ **Comprehensive** - 31 backend + 8 frontend tests  
✅ **CI/CD Ready** - Works in any environment  
✅ **Easy to Debug** - Clear error messages and logging  
✅ **Maintainable** - Well-organized and documented  

For specific testing guidance, see:
- Backend: [backend/TESTING.md](../backend/TESTING.md)
- Frontend: [frontend tests](../frontend/src/)
- E2E: [Playwright](../frontend/e2e/)

---

**Questions?** Check the parent README.md for quick start and troubleshooting.
