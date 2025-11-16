import { Router } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import rateLimit from 'express-rate-limit';
import { validateConfig } from '../config.js';
import logger from '../logger.js';
import { authSecurityHeaders } from '../middleware/security.js';
import { auditAuthMiddleware, AuditEventType, logAuditEvent } from '../middleware/audit.js';

const router = Router();

// Rate limiting for auth endpoints to prevent abuse
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many authentication requests from this IP, please try again later.',
    retryAfter: 15 * 60, // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded for auth endpoint', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      error: 'Too many authentication requests from this IP, please try again later.',
      retryAfter: 15 * 60,
    });
  },
});

// Apply rate limiting before other middleware
router.use(authRateLimit);

// Apply audit logging for auth events
router.use(auditAuthMiddleware);

// Apply additional security headers for auth endpoints
router.use(authSecurityHeaders);

// Lazy-loaded config and JWKS client
let config: any = null;
let jwksClientInstance: any = null;

function getConfig() {
  if (!config) {
    try {
      config = validateConfig();
    } catch (error) {
      // In development, provide fallback values if Azure AD is not configured
      if (process.env.NODE_ENV === 'development') {
        config = {
          AZURE_TENANT_ID: 'common',
          AZURE_ISSUER: 'https://login.microsoftonline.com/common/v2.0',
          AZURE_AUDIENCE: 'api://localhost:3001',
          AZURE_AUDIENCE_WITH_SCOPE: 'api://localhost:3001/.default',
        };
        logger.warn('Using development fallback Azure AD configuration');
      } else {
        throw error;
      }
    }
  }
  return config;
}

function getJwksClient() {
  if (!jwksClientInstance) {
    const cfg = getConfig();
    jwksClientInstance = jwksClient({
      jwksUri: `https://login.microsoftonline.com/${cfg.AZURE_TENANT_ID}/discovery/v2.0/keys`,
    });
  }
  return jwksClientInstance;
}

// Function to get signing key
function getKey(header: any, callback: any) {
  getJwksClient().getSigningKey(header.kid, (err: any, key: any) => {
    if (err) {
      callback(err);
    } else {
      const signingKey = key?.getPublicKey();
      callback(null, signingKey);
    }
  });
}

// Middleware to validate Azure AD token
export async function validateAzureToken(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const cfg = getConfig();

    // Verify token
    jwt.verify(
      token,
      getKey,
      {
        issuer: cfg.AZURE_ISSUER,
        audience: [cfg.AZURE_AUDIENCE, cfg.AZURE_AUDIENCE_WITH_SCOPE],
      },
      (err: any, decoded: any) => {
        if (err) {
          logger.error('Token validation failed', { error: err.message });
          return res.status(401).json({ error: 'Invalid token' });
        }

        req.user = decoded;
        next();
      }
    );
  } catch (error) {
    logger.error('Token validation error', { error });
    res.status(500).json({ error: 'Token validation failed' });
  }
}

router.get('/me', validateAzureToken, async (req, res) => {
  try {
    const user = req.user;

    // Log user info access for audit purposes
    logAuditEvent(
      AuditEventType.USER_INFO_ACCESS,
      {
        userId: user.oid || user.sub,
        userEmail: user.preferred_username || user.upn,
        claimsAccessed: ['name', 'email', 'oid', 'sub'],
      },
      req
    );

    res.json({
      name: user.name,
      email: user.preferred_username || user.upn,
      oid: user.oid,
      sub: user.sub,
    });
  } catch (error) {
    logger.error('Error getting user info', { error });
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

export default router;
