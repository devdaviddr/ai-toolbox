import type { Request, Response } from 'express';
import sql from 'mssql';
import logger from '../logger.js';
import os from 'os';

// Simple in-memory rate limiting for health endpoint
// In production, consider using Redis or a more robust solution
const healthRequests = new Map<string, { count: number; resetTime: number }>();

const HEALTH_RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute per IP
};

function checkHealthRateLimit(ip: string): boolean {
  const now = Date.now();
  const clientData = healthRequests.get(ip);

  if (!clientData || now > clientData.resetTime) {
    // First request or window expired
    healthRequests.set(ip, { count: 1, resetTime: now + HEALTH_RATE_LIMIT.windowMs });
    return true;
  }

  if (clientData.count >= HEALTH_RATE_LIMIT.maxRequests) {
    return false; // Rate limit exceeded
  }

  clientData.count++;
  return true;
}

export const checkHealth = async (req: Request, res: Response) => {
  const startTime = process.hrtime.bigint();

  // Apply rate limiting
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  if (!checkHealthRateLimit(clientIP)) {
    logger.warn('Health endpoint rate limit exceeded', { ip: clientIP });
    return res.status(429).json({
      status: 'rate_limited',
      message: 'Too many health check requests',
      retryAfter: Math.ceil((healthRequests.get(clientIP)?.resetTime || Date.now()) / 1000),
    });
  }

  try {
    // Test database connection with a simple query
    const dbStartTime = process.hrtime.bigint();
    await sql.query('SELECT 1 as test');
    const dbEndTime = process.hrtime.bigint();
    const dbResponseTime = Number(dbEndTime - dbStartTime) / 1e6; // Convert to milliseconds

    // Calculate uptime
    const uptime = process.uptime();

    // Get memory usage
    const memUsage = process.memoryUsage();

    // Get system information
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      environment: process.env.NODE_ENV || 'development',
      hostname: os.hostname(),
    };

    // Calculate response time
    const endTime = process.hrtime.bigint();
    const responseTime = Number(endTime - startTime) / 1e6; // Convert to milliseconds

    // Sanitize response - don't expose internal database details
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      metrics: {
        uptime: Math.floor(uptime),
        memory: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
          external: Math.round(memUsage.external / 1024 / 1024), // MB
          rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        },
        responseTime: Math.round(responseTime),
        dbResponseTime: Math.round(dbResponseTime),
      },
      system: systemInfo,
      // Remove testResult to prevent information leakage
    });
  } catch (error: any) {
    logger.error('Health check failed', {
      error: error.message,
      // Don't log stack trace in production for security
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });

    // Calculate response time even on error
    const endTime = process.hrtime.bigint();
    const responseTime = Number(endTime - startTime) / 1e6;

    // Sanitize error response - don't expose internal details
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
      metrics: {
        responseTime: Math.round(responseTime),
      },
      // Don't expose error details in production
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};
