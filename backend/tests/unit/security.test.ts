import request from 'supertest';
import { createTestApp, addErrorHandling } from '../utils.js';
import { validateConfig } from '../../src/config.js';
import { securityHeaders, authSecurityHeaders } from '../../src/middleware/security.js';

describe('Security Headers', () => {
  let app: any;

  beforeEach(() => {
    app = createTestApp();

    // Apply security middleware
    app.use(securityHeaders);

    // Add test routes
    app.get('/health', (req: any, res: any) => {
      res.json({ status: 'healthy' });
    });

    app.get('/auth/me', authSecurityHeaders, (req: any, res: any) => {
      res.json({ user: 'test' });
    });

    addErrorHandling(app);
  });

  test('should include security headers on all endpoints', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['content-security-policy']).toBeDefined();
    expect(response.headers['strict-transport-security']).toBeDefined();
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['referrer-policy']).toBeDefined();
    expect(response.headers['permissions-policy']).toBeDefined();
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  test('should include additional security headers on auth endpoints', async () => {
    const response = await request(app).get('/auth/me');

    expect(response.headers['cache-control']).toContain('no-store');
    expect(response.headers['pragma']).toBe('no-cache');
    expect(response.headers['expires']).toBe('0');
  });
});

describe('Azure AD Configuration Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('should validate Azure AD UUID formats', () => {
    // Set up valid base config
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3001';
    process.env.LOG_LEVEL = 'info';
    process.env.DB_USER = 'test';
    process.env.DB_PASSWORD = 'test';
    process.env.DB_SERVER = 'test';
    process.env.DB_NAME = 'test';
    process.env.AZURE_AUDIENCE = 'api://12345678-1234-1234-1234-123456789abc';
    process.env.AZURE_AUDIENCE_WITH_SCOPE = 'api://12345678-1234-1234-1234-123456789abc';
    process.env.AZURE_ISSUER = 'https://login.microsoftonline.com/12345678-1234-1234-1234-123456789abc/v2.0';

    // Test invalid client ID
    process.env.AZURE_CLIENT_ID = 'invalid-uuid';
    process.env.AZURE_TENANT_ID = '12345678-1234-1234-1234-123456789abc';

    expect(() => validateConfig()).toThrow('AZURE_CLIENT_ID must be a valid UUID');
  });

  test('should validate Azure AD issuer URL format', () => {
    // Set up valid base config
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3001';
    process.env.LOG_LEVEL = 'info';
    process.env.DB_USER = 'test';
    process.env.DB_PASSWORD = 'test';
    process.env.DB_SERVER = 'test';
    process.env.DB_NAME = 'test';
    process.env.AZURE_CLIENT_ID = '12345678-1234-1234-1234-123456789abc';
    process.env.AZURE_TENANT_ID = '12345678-1234-1234-1234-123456789abc';
    process.env.AZURE_AUDIENCE = 'api://12345678-1234-1234-1234-123456789abc';
    process.env.AZURE_AUDIENCE_WITH_SCOPE = 'api://12345678-1234-1234-1234-123456789abc';

    process.env.AZURE_ISSUER = 'https://invalid-issuer.com';

    expect(() => validateConfig()).toThrow('AZURE_ISSUER must be a valid Azure AD v2.0 issuer URL');
  });

  test('should validate audience format', () => {
    // Set up valid base config
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3001';
    process.env.LOG_LEVEL = 'info';
    process.env.DB_USER = 'test';
    process.env.DB_PASSWORD = 'test';
    process.env.DB_SERVER = 'test';
    process.env.DB_NAME = 'test';
    process.env.AZURE_CLIENT_ID = '12345678-1234-1234-1234-123456789abc';
    process.env.AZURE_TENANT_ID = '12345678-1234-1234-1234-123456789abc';
    process.env.AZURE_ISSUER = 'https://login.microsoftonline.com/12345678-1234-1234-1234-123456789abc/v2.0';
    process.env.AZURE_AUDIENCE_WITH_SCOPE = 'api://12345678-1234-1234-1234-123456789abc';

    process.env.AZURE_AUDIENCE = 'invalid-audience';

    expect(() => validateConfig()).toThrow('AZURE_AUDIENCE must be a valid Azure AD application URI');
  });
});