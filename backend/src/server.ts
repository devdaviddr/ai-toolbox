import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import sql from 'mssql';
import z from 'zod';
import { checkHealth } from './routes/health.js';
import authRoutes from './routes/auth.js';
import { initializeDatabase } from './database/init.js';
import logger from './logger.js';
import { validateConfig } from './config.js';
import { securityHeaders } from './middleware/security.js';

const app = express();
// Note: port is read from environment and used in startServer function

// Middleware
app.use(securityHeaders);
app.use(express.json());

// CORS configuration for auth endpoints
const authCorsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    // In development, allow localhost
    if (process.env.NODE_ENV === 'development' && origin.match(/^https?:\/\/localhost(:\d+)?$/)) {
      return callback(null, true);
    }

    // In production, you should specify allowed origins explicitly
    // For now, we'll be restrictive and only allow same-origin
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With'],
  maxAge: 86400, // 24 hours
};

app.use('/auth', cors(authCorsOptions));

// General CORS for other endpoints (more permissive for development)
const generalCorsOptions = {
  origin:
    process.env.NODE_ENV === 'development'
      ? true
      : process.env.ALLOWED_ORIGINS?.split(',') || false,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(generalCorsOptions));

// Routes
app.get('/', (req, res) => {
  res.send('Backend API is running');
});

app.get('/health', checkHealth);
app.use('/auth', authRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Initialize database first, then connect
const startServer = async () => {
  try {
    // Validate configuration (skip Azure AD validation in development if not configured)
    let envConfig;
    try {
      envConfig = validateConfig();
      logger.info('Configuration validated successfully');
    } catch (configError) {
      if (process.env.NODE_ENV === 'development') {
        // In development, try to validate just the database config
        const dbConfigSchema = z.object({
          NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
          PORT: z.coerce.number().int().positive().default(3001),
          LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
          DB_USER: z.string().min(1, 'DB_USER is required'),
          DB_PASSWORD: z.string().min(1, 'DB_PASSWORD is required'),
          DB_SERVER: z.string().min(1, 'DB_SERVER is required'),
          DB_NAME: z.string().min(1, 'DB_NAME is required'),
        });

        envConfig = dbConfigSchema.parse(process.env);
        logger.warn('Azure AD configuration missing - auth routes will use development fallbacks', {
          error: configError instanceof Error ? configError.message : String(configError),
        });
      } else {
        throw configError;
      }
    }

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
    logger.info('Connected to MSSQL database', {
      database: envConfig.DB_NAME,
      server: envConfig.DB_SERVER,
    });

    app.listen(envConfig.PORT, () => {
      logger.info('Server started successfully', {
        port: envConfig.PORT,
        environment: envConfig.NODE_ENV,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
};

// Export app for testing
export default app;

// Start server if this file is run directly and not in test environment
if (import.meta.url === `file://${process.argv[1]}` && process.env.NODE_ENV !== 'test') {
  startServer();
}
