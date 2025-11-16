import winston from 'winston';

/**
 * Audit logger for authentication and security events
 * Provides structured logging for compliance and monitoring
 */
let auditLogger: winston.Logger | null = null;

function getAuditLogger(): winston.Logger {
  if (!auditLogger) {
    // Lazy initialization to avoid config validation at module load time
    const nodeEnv = process.env.NODE_ENV || 'development';

    auditLogger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'auth-audit' },
      transports: [
        // Write audit logs to a separate file
        new winston.transports.File({
          filename: 'logs/auth-audit.log',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
          tailable: true
        }),
        // Also log to console in development
        ...(nodeEnv === 'development' ? [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            )
          })
        ] : [])
      ],
    });
  }

  return auditLogger;
}

/**
 * Audit event types for authentication
 */
export enum AuditEventType {
  TOKEN_VALIDATION_SUCCESS = 'TOKEN_VALIDATION_SUCCESS',
  TOKEN_VALIDATION_FAILURE = 'TOKEN_VALIDATION_FAILURE',
  USER_INFO_ACCESS = 'USER_INFO_ACCESS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  CORS_VIOLATION = 'CORS_VIOLATION',
  SECURITY_HEADER_VIOLATION = 'SECURITY_HEADER_VIOLATION',
}

/**
 * Log an audit event
 */
export function logAuditEvent(
  eventType: AuditEventType,
  details: Record<string, any>,
  req?: any
) {
  const auditEntry = {
    eventType,
    timestamp: new Date().toISOString(),
    ip: req?.ip || 'unknown',
    userAgent: req?.get('User-Agent') || 'unknown',
    path: req?.path || 'unknown',
    method: req?.method || 'unknown',
    ...details,
  };

  getAuditLogger().info('Auth audit event', auditEntry);
}

/**
 * Middleware to log authentication events
 */
export function auditAuthMiddleware(req: any, res: any, next: any) {
  const startTime = Date.now();

  // Log when response is finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const user = req.user;

    logAuditEvent(
      res.statusCode === 200 ? AuditEventType.TOKEN_VALIDATION_SUCCESS : AuditEventType.TOKEN_VALIDATION_FAILURE,
      {
        statusCode: res.statusCode,
        duration,
        userId: user?.oid || user?.sub || 'unknown',
        userEmail: user?.preferred_username || user?.upn || 'unknown',
      },
      req
    );
  });

  next();
}