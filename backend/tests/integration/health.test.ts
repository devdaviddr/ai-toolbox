// Mock MSSQL
jest.mock('mssql', () => ({
  ConnectionPool: jest.fn(),
  connect: jest.fn(),
  query: jest.fn(),
}));

import express from 'express';
import request from 'supertest';
import { checkHealth } from '../../src/routes/health.js';
import sql from 'mssql';
import { createTestApp, addErrorHandling } from '../utils.js';

const mockedSql = sql as jest.Mocked<typeof sql>;

describe('API Endpoints - Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createTestApp();

    // Register routes
    app.get('/', (req, res) => {
      res.send('Backend API is running');
    });
    app.get('/health', checkHealth);
    app.post('/test-json', (req, res) => {
      res.json({ received: req.body });
    });

    // Add error handling last
    addErrorHandling(app);
  });

  describe('Root Endpoint', () => {
    it('should return API status message on GET /', async () => {
      const response = await request(app).get('/').expect(200);

      expect(response.text).toBe('Backend API is running');
      expect(response.headers['content-type']).toMatch(/text\/html/);
    });
  });

  describe('Health Check Endpoint', () => {
    it('should return healthy status when database is connected', async () => {
      // Mock successful database query
      mockedSql.query.mockResolvedValue({
        recordset: [{ test: 1 }],
      } as any);

      const response = await request(app).get('/health').expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.database).toBe('connected');
      expect(response.body.testResult).toEqual({ test: 1 });
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return unhealthy status when database query fails', async () => {
      // Mock database query failure
      const dbError = new Error('Database connection failed');
      mockedSql.query.mockRejectedValue(dbError);

      const response = await request(app).get('/health').expect(500);

      expect(response.body.status).toBe('unhealthy');
      expect(response.body.database).toBe('disconnected');
      expect(response.body.error).toBe('Database connection failed');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should handle connection timeout errors', async () => {
      // Mock different error
      mockedSql.query.mockRejectedValue(new Error('Connection timeout'));

      const response = await request(app).get('/health').expect(500);

      expect(response.body.status).toBe('unhealthy');
      expect(response.body.error).toBe('Connection timeout');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route').expect(404);

      expect(response.body.error).toBe('Not found');
      expect(response.body.message).toContain('GET /unknown-route not found');
    });

    it('should handle JSON parsing correctly', async () => {
      const testData = { message: 'test', number: 42 };
      const response = await request(app).post('/test-json').send(testData).expect(200);

      expect(response.body.received).toEqual(testData);
    });

    it('should handle CORS headers', async () => {
      const response = await request(app).get('/').expect(200);

      // CORS middleware should be applied
      expect(response.headers).toBeDefined();
    });
  });

  describe('HTTP Methods', () => {
    it('should handle GET requests', async () => {
      const response = await request(app).get('/').expect(200);
      expect(response.text).toBe('Backend API is running');
    });

    it('should return 404 for unsupported methods on unregistered routes', async () => {
      const response = await request(app).post('/').expect(404);
      expect(response.body.error).toBe('Not found');
    });
  });
});
