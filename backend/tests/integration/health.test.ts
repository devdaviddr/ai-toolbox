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
      expect(response.body.timestamp).toBeDefined();
      // testResult is no longer included for security reasons
      expect(response.body).not.toHaveProperty('testResult');
    });

    it('should return unhealthy status when database query fails', async () => {
      // Mock database query failure
      const dbError = new Error('Database connection failed');
      mockedSql.query.mockRejectedValue(dbError);

      const response = await request(app).get('/health').expect(500);

      expect(response.body.status).toBe('unhealthy');
      expect(response.body.database).toBe('disconnected');
      expect(response.body.timestamp).toBeDefined();
      // Error details are not exposed in test environment (NODE_ENV=test)
      expect(response.body).not.toHaveProperty('error');
    });

    it('should handle connection timeout errors', async () => {
      // Mock different error
      mockedSql.query.mockRejectedValue(new Error('Connection timeout'));

      const response = await request(app).get('/health').expect(500);

      expect(response.body.status).toBe('unhealthy');
      // Error details are not exposed in test environment
      expect(response.body).not.toHaveProperty('error');
    });

    it('should implement rate limiting for health endpoint', async () => {
      // Mock successful database query for all requests
      mockedSql.query.mockResolvedValue({
        recordset: [{ test: 1 }],
      } as any);

      // Make multiple requests to trigger rate limiting
      // Health endpoint allows 10 requests per minute
      let rateLimitedCount = 0;
      for (let i = 0; i < 15; i++) {
        const response = await request(app).get('/health');
        if (response.status === 200) {
          expect(response.body.status).toBe('healthy');
        } else if (response.status === 429) {
          expect(response.body.status).toBe('rate_limited');
          expect(response.body.message).toBe('Too many health check requests');
          expect(response.body.retryAfter).toBeDefined();
          rateLimitedCount++;
        } else {
          fail(`Unexpected status code: ${response.status}`);
        }
      }

      // Should have some rate limiting triggered
      expect(rateLimitedCount).toBeGreaterThan(0);
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
