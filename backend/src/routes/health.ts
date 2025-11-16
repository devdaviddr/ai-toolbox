import type { Request, Response } from 'express';
import sql from 'mssql';

export const checkHealth = async (req: Request, res: Response) => {
  try {
    // Test database connection with a simple query
    const result = await sql.query('SELECT 1 as test');
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      testResult: result.recordset[0]
    });
  } catch (error: any) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
};