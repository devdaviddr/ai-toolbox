import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import sql from 'mssql';
import { checkHealth } from './routes/health.js';
import { initializeDatabase } from './database/init.js';
import logger from './logger.js';
import { validateConfig } from './config.js';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.get('/', (req, res) => {
  res.send('Backend API is running');
});

app.get('/health', checkHealth);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', { error: err.message, stack: err.stack, url: req.url, method: req.method });
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Initialize database first, then connect
const startServer = async () => {
  try {
    // Validate configuration
    const envConfig = validateConfig();
    logger.info('Configuration validated successfully');

    // Build MSSQL config from validated env
    const sqlConfig: sql.config = {
      user: envConfig.DB_USER,
      password: envConfig.DB_PASSWORD,
      server: envConfig.DB_SERVER,
      database: envConfig.DB_NAME,
      options: {
        encrypt: true,
        trustServerCertificate: true,
      },
    };

    await initializeDatabase();
    
    // Connect to MSSQL
    await sql.connect(sqlConfig);
    logger.info('Connected to MSSQL database', { database: envConfig.DB_NAME, server: envConfig.DB_SERVER });

    app.listen(envConfig.PORT, () => {
      logger.info('Server started successfully', { port: envConfig.PORT, environment: envConfig.NODE_ENV });
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
};

// Export app for testing
export default app;

// Start server if this file is run directly and not in test environment
if (import.meta.url === `file://${process.argv[1]}` && process.env.NODE_ENV !== 'test') {
  startServer();
}