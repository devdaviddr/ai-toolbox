import express, { Express } from 'express';
import cors from 'cors';
import type { Server } from 'http';

/**
 * Creates a test Express app with common middleware configured
 */
export function createTestApp(): Express {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors());

  return app;
}

/**
 * Adds error handling middleware to the app
 */
export function addErrorHandling(app: Express): void {
  // 404 handler
  app.use((req: express.Request, res: express.Response) => {
    res.status(404).json({
      error: 'Not found',
      message: `Route ${req.method} ${req.path} not found`,
    });
  });

  // Error handler (must be last)
  app.use(
    (err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error('Unhandled error:', err);
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
      });
    }
  );
}

/**
 * Starts a test server and returns it with a cleanup function
 */
export async function startTestServer(
  app: Express,
  port: number = 0
): Promise<{ server: Server; port: number; close: () => Promise<void> }> {
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      const assignedPort = (server.address() as any).port;
      resolve({
        server,
        port: assignedPort,
        close: () =>
          new Promise((resolveClose, rejectClose) => {
            server.close((err) => {
              if (err) rejectClose(err);
              else resolveClose();
            });
          }),
      });
    });
  });
}

/**
 * Mock response helper for testing
 */
export function createMockResponse(): express.Response {
  return {
    json: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    end: jest.fn(),
  } as any;
}

/**
 * Mock request helper for testing
 */
export function createMockRequest(overrides = {}): express.Request {
  return {
    method: 'GET',
    path: '/',
    headers: {},
    body: {},
    query: {},
    params: {},
    ...overrides,
  } as any;
}
