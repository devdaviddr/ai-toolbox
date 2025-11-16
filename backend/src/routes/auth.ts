import { Router } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { validateConfig } from '../config.js';
import logger from '../logger.js';

const router = Router();

const config = validateConfig();

// JWKS client for Azure AD
const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${config.AZURE_TENANT_ID}/discovery/v2.0/keys`,
});

// Function to get signing key
function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key) => {
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

    // Verify token
    jwt.verify(
      token,
      getKey,
      {
        issuer: config.AZURE_ISSUER,
        audience: [config.AZURE_AUDIENCE, config.AZURE_AUDIENCE_WITH_SCOPE],
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
