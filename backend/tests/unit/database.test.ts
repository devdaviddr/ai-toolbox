// Mock MSSQL
jest.mock('mssql', () => ({
  ConnectionPool: jest.fn(),
  connect: jest.fn(),
  query: jest.fn(),
}));

import sql from 'mssql';
import { initializeDatabase, getInitConfig } from '../../src/database/init.js';

const mockedSql = sql as jest.Mocked<typeof sql>;

describe('Database Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeDatabase', () => {
    it('should successfully initialize database when connection succeeds', async () => {
      const mockPool = {
        connect: jest.fn().mockResolvedValue(undefined),
        request: jest.fn().mockReturnValue({
          query: jest.fn().mockResolvedValue(undefined),
        }),
        close: jest.fn().mockResolvedValue(undefined),
      };

      mockedSql.ConnectionPool.mockImplementation(() => mockPool as any);

      await expect(initializeDatabase()).resolves.toBeUndefined();

      expect(mockedSql.ConnectionPool).toHaveBeenCalledWith({
        user: 'testuser',
        password: 'testpass',
        server: 'localhost',
        database: 'master',
        options: {
          encrypt: true,
          trustServerCertificate: true,
        },
      });

      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockPool.request).toHaveBeenCalled();
      expect(mockPool.close).toHaveBeenCalled();
    });

    it('should handle database connection errors gracefully', async () => {
      const mockPool = {
        connect: jest.fn().mockRejectedValue(new Error('Connection failed')),
        close: jest.fn(),
      };

      mockedSql.ConnectionPool.mockImplementation(() => mockPool as any);

      // Should not throw, just log error
      await expect(initializeDatabase()).resolves.toBeUndefined();

      expect(mockPool.connect).toHaveBeenCalled();
      // close should not be called since connect failed
      expect(mockPool.close).not.toHaveBeenCalled();
    });

    it('should handle query execution errors gracefully', async () => {
      const mockPool = {
        connect: jest.fn().mockResolvedValue(undefined),
        request: jest.fn().mockReturnValue({
          query: jest.fn().mockRejectedValue(new Error('Query failed')),
        }),
        close: jest.fn().mockResolvedValue(undefined),
      };

      mockedSql.ConnectionPool.mockImplementation(() => mockPool as any);

      await expect(initializeDatabase()).resolves.toBeUndefined();

      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockPool.request).toHaveBeenCalled();
      // close should not be called since query failed
      expect(mockPool.close).not.toHaveBeenCalled();
    });

    it('should create database with correct SQL statement', async () => {
      const mockRequest = {
        query: jest.fn().mockResolvedValue(undefined),
      };
      const mockPool = {
        connect: jest.fn().mockResolvedValue(undefined),
        request: jest.fn().mockReturnValue(mockRequest),
        close: jest.fn().mockResolvedValue(undefined),
      };

      mockedSql.ConnectionPool.mockImplementation(() => mockPool as any);

      await initializeDatabase();

      expect(mockRequest.query).toHaveBeenCalledWith(
        expect.stringContaining("IF DB_ID('ai_toolbox_db') IS NULL")
      );
      expect(mockRequest.query).toHaveBeenCalledWith(
        expect.stringContaining('CREATE DATABASE ai_toolbox_db')
      );
    });

    it('should connect to master database for initialization', async () => {
      const mockPool = {
        connect: jest.fn().mockResolvedValue(undefined),
        request: jest.fn().mockReturnValue({
          query: jest.fn().mockResolvedValue(undefined),
        }),
        close: jest.fn().mockResolvedValue(undefined),
      };

      mockedSql.ConnectionPool.mockImplementation(() => mockPool as any);

      await initializeDatabase();

      expect(mockedSql.ConnectionPool).toHaveBeenCalledWith(
        expect.objectContaining({
          database: 'master',
        })
      );
    });

    it('should enable encryption and trust certificate for SQL Server', async () => {
      const mockPool = {
        connect: jest.fn().mockResolvedValue(undefined),
        request: jest.fn().mockReturnValue({
          query: jest.fn().mockResolvedValue(undefined),
        }),
        close: jest.fn().mockResolvedValue(undefined),
      };

      mockedSql.ConnectionPool.mockImplementation(() => mockPool as any);

      await initializeDatabase();

      expect(mockedSql.ConnectionPool).toHaveBeenCalledWith(
        expect.objectContaining({
          options: {
            encrypt: true,
            trustServerCertificate: true,
          },
        })
      );
    });

    it('should always close pool after successful initialization', async () => {
      const mockPool = {
        connect: jest.fn().mockResolvedValue(undefined),
        request: jest.fn().mockReturnValue({
          query: jest.fn().mockResolvedValue(undefined),
        }),
        close: jest.fn().mockResolvedValue(undefined),
      };

      mockedSql.ConnectionPool.mockImplementation(() => mockPool as any);

      await initializeDatabase();

      expect(mockPool.close).toHaveBeenCalled();
    });

    it('should use environment variables for database configuration', async () => {
      const mockPool = {
        connect: jest.fn().mockResolvedValue(undefined),
        request: jest.fn().mockReturnValue({
          query: jest.fn().mockResolvedValue(undefined),
        }),
        close: jest.fn().mockResolvedValue(undefined),
      };

      mockedSql.ConnectionPool.mockImplementation(() => mockPool as any);

      await initializeDatabase();

      expect(mockedSql.ConnectionPool).toHaveBeenCalledWith(
        expect.objectContaining({
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          server: process.env.DB_SERVER,
        })
      );
    });
  });
});
  describe('getInitConfig', () => {
    it('should return config with environment variables when set', () => {
      const config = getInitConfig();
      
      expect(config.user).toBe(process.env.DB_USER);
      expect(config.password).toBe(process.env.DB_PASSWORD);
      expect(config.server).toBe(process.env.DB_SERVER);
      expect(config.database).toBe('master');
    });

    it('should use default user when DB_USER is not set', () => {
      const originalUser = process.env.DB_USER;
      delete process.env.DB_USER;
      
      const config = getInitConfig();
      expect(config.user).toBe('sa');
      
      if (originalUser) process.env.DB_USER = originalUser;
    });

    it('should use default password when DB_PASSWORD is not set', () => {
      const originalPassword = process.env.DB_PASSWORD;
      delete process.env.DB_PASSWORD;
      
      const config = getInitConfig();
      expect(config.password).toBe('Password123!');
      
      if (originalPassword) process.env.DB_PASSWORD = originalPassword;
    });

    it('should use default server when DB_SERVER is not set', () => {
      const originalServer = process.env.DB_SERVER;
      delete process.env.DB_SERVER;
      
      const config = getInitConfig();
      expect(config.server).toBe('localhost');
      
      if (originalServer) process.env.DB_SERVER = originalServer;
    });

    it('should have encryption enabled', () => {
      const config = getInitConfig();
      expect(config.options?.encrypt).toBe(true);
    });

    it('should trust self-signed certificates', () => {
      const config = getInitConfig();
      expect(config.options?.trustServerCertificate).toBe(true);
    });
  });
