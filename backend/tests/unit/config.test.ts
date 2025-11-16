import { validateConfig, type Config } from '../../src/config.js';

describe('Config Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('validateConfig', () => {
    it('should return valid config with required environment variables', () => {
      const config = validateConfig();

      expect(config).toHaveProperty('DB_USER');
      expect(config).toHaveProperty('DB_PASSWORD');
      expect(config).toHaveProperty('DB_SERVER');
      expect(config).toHaveProperty('DB_NAME');
      expect(config).toHaveProperty('NODE_ENV');
      expect(config).toHaveProperty('PORT');
      expect(config).toHaveProperty('AZURE_CLIENT_ID');
      expect(config).toHaveProperty('AZURE_TENANT_ID');
      expect(config).toHaveProperty('AZURE_AUDIENCE');
      expect(config).toHaveProperty('AZURE_AUDIENCE_WITH_SCOPE');
      expect(config).toHaveProperty('AZURE_ISSUER');
    });

    it('should use test environment by default', () => {
      const config = validateConfig();
      expect(config.NODE_ENV).toBe('test');
    });

    it('should return numeric PORT as number', () => {
      const config = validateConfig();
      expect(typeof config.PORT).toBe('number');
      expect(config.PORT).toBeGreaterThan(0);
    });

    it('should require DB_USER to be non-empty', () => {
      process.env.DB_USER = '';
      expect(() => validateConfig()).toThrow('DB_USER is required');
    });

    it('should require DB_PASSWORD to be non-empty', () => {
      process.env.DB_PASSWORD = '';
      expect(() => validateConfig()).toThrow('DB_PASSWORD is required');
    });

    it('should require DB_SERVER to be non-empty', () => {
      process.env.DB_SERVER = '';
      expect(() => validateConfig()).toThrow('DB_SERVER is required');
    });

    it('should require DB_NAME to be non-empty', () => {
      process.env.DB_NAME = '';
      expect(() => validateConfig()).toThrow('DB_NAME is required');
    });

    it('should accept valid NODE_ENV values', () => {
      const validEnvs = ['development', 'production', 'test'];

      for (const env of validEnvs) {
        process.env.NODE_ENV = env;
        expect(() => validateConfig()).not.toThrow();
      }
    });

    it('should reject invalid NODE_ENV values', () => {
      process.env.NODE_ENV = 'staging';
      expect(() => validateConfig()).toThrow();
    });

    it('should accept valid LOG_LEVEL values', () => {
      const validLevels = ['error', 'warn', 'info', 'debug'];

      for (const level of validLevels) {
        process.env.LOG_LEVEL = level;
        expect(() => validateConfig()).not.toThrow();
      }
    });

    it('should provide descriptive error messages for validation failures', () => {
      process.env.DB_USER = '';
      process.env.PORT = 'invalid';

      try {
        validateConfig();
        fail('Should have thrown an error');
      } catch (error) {
        const errorMessage = (error as Error).message;
        expect(errorMessage).toContain('Configuration validation failed');
      }
    });

    it('should default PORT to 3001 if not provided', () => {
      delete process.env.PORT;
      const config = validateConfig();
      expect(config.PORT).toBe(3001);
    });

    it('should default LOG_LEVEL to info if not provided', () => {
      delete process.env.LOG_LEVEL;
      const config = validateConfig();
      expect(config.LOG_LEVEL).toBe('info');
    });
  });

  describe('Config Type', () => {
    it('should have all required properties in Config type', () => {
      const config = validateConfig();
      const requiredProperties: (keyof Config)[] = [
        'NODE_ENV',
        'PORT',
        'LOG_LEVEL',
        'DB_USER',
        'DB_PASSWORD',
        'DB_SERVER',
        'DB_NAME',
        'AZURE_CLIENT_ID',
        'AZURE_TENANT_ID',
        'AZURE_AUDIENCE',
        'AZURE_AUDIENCE_WITH_SCOPE',
        'AZURE_ISSUER',
      ];

      for (const prop of requiredProperties) {
        expect(config).toHaveProperty(prop);
      }
    });
  });
});
