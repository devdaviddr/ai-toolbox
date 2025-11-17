import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import '../types.d.ts';

export interface AuthRequest extends Request {
  user?: any;
}
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
    // Use /common endpoint to accept tokens from both specific tenant and multi-tenant scenarios
    jwksClientInstance = jwksClient({
      jwksUri: `https://login.microsoftonline.com/common/discovery/v2.0/keys`,
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
export async function validateAzureToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const cfg = getConfig();

    // First, decode the token without verification to inspect its claims
    const decoded = jwt.decode(token, { complete: true });
    
    if (!decoded) {
      logger.error('Token decode failed', { error: 'Could not decode token' });
      return res.status(401).json({ error: 'Invalid token' });
    }

    const tokenIssuer = (decoded.payload as any).iss;
    const tokenAudience = (decoded.payload as any).aud;
    
    logger.debug('Token claims', { 
      issuer: tokenIssuer, 
      audience: tokenAudience,
      expectedIssuer: cfg.AZURE_ISSUER,
      expectedAudiences: [cfg.AZURE_AUDIENCE, cfg.AZURE_AUDIENCE_WITH_SCOPE]
    });

    // Check if audience matches
    const audienceMatch = Array.isArray(tokenAudience) 
      ? tokenAudience.some(aud => [cfg.AZURE_AUDIENCE, cfg.AZURE_AUDIENCE_WITH_SCOPE].includes(aud))
      : [cfg.AZURE_AUDIENCE, cfg.AZURE_AUDIENCE_WITH_SCOPE].includes(tokenAudience);

    if (!audienceMatch) {
      logger.error('Token audience validation failed', { 
        tokenAudience, 
        expectedAudiences: [cfg.AZURE_AUDIENCE, cfg.AZURE_AUDIENCE_WITH_SCOPE]
      });
      return res.status(401).json({ error: 'Invalid token audience' });
    }

    // Verify token with relaxed issuer validation - accept both v1 and v2 endpoints
    jwt.verify(
      token,
      getKey,
      {
        // Accept multiple Azure AD issuer formats:
        // - v2.0 with specific tenant
        // - v2.0 with /common (multi-tenant)
        // - v1.0 with sts.windows.net (legacy)
        issuer: [
          cfg.AZURE_ISSUER,
          `https://login.microsoftonline.com/common/v2.0`,
          `https://login.microsoftonline.com/${cfg.AZURE_TENANT_ID}/v2.0`,
          `https://sts.windows.net/${cfg.AZURE_TENANT_ID}/`,
        ],
        audience: [cfg.AZURE_AUDIENCE, cfg.AZURE_AUDIENCE_WITH_SCOPE],
      },
      (err: any, verified: any) => {
        if (err) {
          logger.error('Token verification failed', { 
            error: err.message,
            tokenIssuer,
            expectedIssuers: [
              cfg.AZURE_ISSUER,
              `https://login.microsoftonline.com/common/v2.0`,
              `https://sts.windows.net/${cfg.AZURE_TENANT_ID}/`
            ]
          });
          return res.status(401).json({ error: 'Invalid token' });
        }

        req.user = verified;
        next();
      }
    );
  } catch (error) {
    logger.error('Token validation error', { error });
    res.status(500).json({ error: 'Token validation failed' });
  }
}

router.get('/me', validateAzureToken, async (req: AuthRequest, res: Response) => {
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
