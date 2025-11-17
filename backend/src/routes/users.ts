import { Router } from 'express';
import type { Response, Request } from 'express';
import sql from 'mssql';
import { validateAzureToken, type AuthRequest } from './auth.js';
import logger from '../logger.js';
import { auditAuthMiddleware, AuditEventType, logAuditEvent } from '../middleware/audit.js';

const router = Router();

// Apply audit logging for user management events
router.use(auditAuthMiddleware);

// Types for user data
interface AzureADClaims {
  oid: string;
  name: string;
  preferred_username?: string;
  upn?: string;
  tid?: string;
  roles?: string[];
  [key: string]: any;
}

// Sync user from Azure AD claims (upsert operation)
router.post('/sync', validateAzureToken, async (req: AuthRequest, res: Response) => {
  const transaction = new sql.Transaction();
  try {
    const claims: AzureADClaims = req.user;
    const oid = claims.oid;

    if (!oid) {
      return res.status(400).json({ error: 'OID is required in token claims' });
    }

    // Try to extract roles from ID token if provided
    let idTokenClaims: any = null;
    const idTokenHeader = req.headers['x-id-token'] as string;
    if (idTokenHeader) {
      try {
        const decoded = jwt.decode(idTokenHeader, { complete: true });
        idTokenClaims = decoded?.payload;
        logger.debug('ID token claims extracted', { roles: idTokenClaims?.roles });
      } catch (error) {
        logger.warn('Failed to decode ID token from header', { error });
      }
    }

    // Log the claims to debug role extraction
    logger.info('User sync called', {
      oid,
      accessTokenRoles: claims.roles,
      idTokenRoles: idTokenClaims?.roles,
      allAccessTokenKeys: Object.keys(claims),
    });

    await transaction.begin();

    // Check if user exists
    const existingUser = await transaction
      .request()
      .input('oid', sql.NVarChar, oid)
      .query('SELECT oid, first_login FROM users WHERE oid = @oid');

    const userData = {
      oid,
      name: claims.name || 'Unknown User',
      email: claims.preferred_username || claims.upn || `${oid}@azuread.local`,
      preferred_username: claims.preferred_username,
      tenant_id: claims.tid,
      // Use roles from ID token if available, otherwise from access token
      roles: idTokenClaims?.roles || claims.roles || [],
      claims,
      last_login: new Date(),
      updated_at: new Date(),
      first_login: undefined as Date | undefined,
      created_at: undefined as Date | undefined,
    };

    if (existingUser.recordset.length === 0) {
      // Create new user
      userData.first_login = new Date();
      userData.created_at = new Date();

      await transaction
        .request()
        .input('oid', sql.NVarChar, userData.oid)
        .input('name', sql.NVarChar, userData.name)
        .input('email', sql.NVarChar, userData.email)
        .input('preferred_username', sql.NVarChar, userData.preferred_username)
        .input('tenant_id', sql.NVarChar, userData.tenant_id)
        .input('roles', sql.NVarChar, JSON.stringify(userData.roles))
        .input('claims', sql.NVarChar, JSON.stringify(userData.claims))
        .input('first_login', sql.DateTime2, userData.first_login)
        .input('last_login', sql.DateTime2, userData.last_login)
        .input('created_at', sql.DateTime2, userData.created_at)
        .input('updated_at', sql.DateTime2, userData.updated_at).query(`
          INSERT INTO users (oid, name, email, preferred_username, tenant_id, roles, claims, first_login, last_login, created_at, updated_at)
          VALUES (@oid, @name, @email, @preferred_username, @tenant_id, @roles, @claims, @first_login, @last_login, @created_at, @updated_at)
        `);

      logAuditEvent(
        AuditEventType.USER_CREATED,
        {
          userId: oid,
          userEmail: userData.email,
          userName: userData.name,
          tenantId: userData.tenant_id,
        },
        req
      );

       logger.info('New user created', { oid, email: userData.email });
     } else {
       // Update existing user
       await transaction
         .request()
         .input('oid', sql.NVarChar, oid)
         .input('roles', sql.NVarChar, JSON.stringify(userData.roles))
         .input('claims', sql.NVarChar, JSON.stringify(userData.claims))
         .input('last_login', sql.DateTime2, userData.last_login)
         .input('updated_at', sql.DateTime2, userData.updated_at)
         .query(
           'UPDATE users SET roles = @roles, claims = @claims, last_login = @last_login, updated_at = @updated_at WHERE oid = @oid'
         );

       logAuditEvent(
         AuditEventType.USER_UPDATED,
         {
           userId: oid,
           userEmail: userData.email,
           lastLogin: userData.last_login,
         },
         req
       );

       logger.info('Existing user updated', { oid, email: userData.email });
    }

    await transaction.commit();

    // Return user data (without sensitive claims)
    const responseUser = {
      oid: userData.oid,
      name: userData.name,
      email: userData.email,
      preferred_username: userData.preferred_username,
      tenant_id: userData.tenant_id,
      roles: userData.roles,
      first_login:
        existingUser.recordset.length > 0
          ? existingUser.recordset[0].first_login
          : userData.first_login,
      last_login: userData.last_login,
    };

    res.json({
      success: true,
      user: responseUser,
      isNewUser: existingUser.recordset.length === 0,
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('User sync failed', {
      error: error instanceof Error ? error.message : String(error),
      oid: req.user?.oid,
    });
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

// Development endpoint for testing user sync without authentication
router.post('/sync-dev', async (req: Request, res: Response) => {
  const transaction = new sql.Transaction();
  try {
    const { oid, name, email, preferred_username, tenant_id, roles } = req.body;

    if (!oid) {
      return res.status(400).json({ error: 'OID is required' });
    }

    // Create mock claims for development
    const claims: AzureADClaims = {
      oid,
      name: name || 'Test User',
      preferred_username: email || preferred_username || `${oid}@test.local`,
      upn: email || preferred_username || `${oid}@test.local`,
      tid: tenant_id || 'test-tenant-id',
      roles: roles || [],
    };

    await transaction.begin();

    // Check if user exists
    const existingUser = await transaction
      .request()
      .input('oid', sql.NVarChar, oid)
      .query('SELECT oid, first_login FROM users WHERE oid = @oid');

    const userData = {
      oid,
      name: claims.name || 'Unknown User',
      email: claims.preferred_username || claims.upn || `${oid}@azuread.local`,
      preferred_username: claims.preferred_username,
      tenant_id: claims.tid,
      roles: claims.roles || [],
      claims,
      last_login: new Date(),
      updated_at: new Date(),
      first_login: undefined as Date | undefined,
      created_at: undefined as Date | undefined,
    };

    if (existingUser.recordset.length === 0) {
      // Create new user
      userData.first_login = new Date();
      userData.created_at = new Date();

      await transaction
        .request()
        .input('oid', sql.NVarChar, userData.oid)
        .input('name', sql.NVarChar, userData.name)
        .input('email', sql.NVarChar, userData.email)
        .input('preferred_username', sql.NVarChar, userData.preferred_username)
        .input('tenant_id', sql.NVarChar, userData.tenant_id)
        .input('roles', sql.NVarChar, JSON.stringify(userData.roles))
        .input('claims', sql.NVarChar, JSON.stringify(userData.claims))
        .input('first_login', sql.DateTime2, userData.first_login)
        .input('last_login', sql.DateTime2, userData.last_login)
        .input('created_at', sql.DateTime2, userData.created_at)
        .input('updated_at', sql.DateTime2, userData.updated_at).query(`
          INSERT INTO users (oid, name, email, preferred_username, tenant_id, roles, claims, first_login, last_login, created_at, updated_at)
          VALUES (@oid, @name, @email, @preferred_username, @tenant_id, @roles, @claims, @first_login, @last_login, @created_at, @updated_at)
        `);

       logger.info('New test user created', { oid, email: userData.email });
     } else {
       // Update existing user
       await transaction
         .request()
         .input('oid', sql.NVarChar, oid)
         .input('roles', sql.NVarChar, JSON.stringify(userData.roles))
         .input('claims', sql.NVarChar, JSON.stringify(userData.claims))
         .input('last_login', sql.DateTime2, userData.last_login)
         .input('updated_at', sql.DateTime2, userData.updated_at)
         .query(
           'UPDATE users SET roles = @roles, claims = @claims, last_login = @last_login, updated_at = @updated_at WHERE oid = @oid'
         );

       logger.info('Existing test user updated', { oid, email: userData.email });
    }

    await transaction.commit();

    // Return user data (without sensitive claims)
    const responseUser = {
      oid: userData.oid,
      name: userData.name,
      email: userData.email,
      preferred_username: userData.preferred_username,
      tenant_id: userData.tenant_id,
      roles: userData.roles,
      first_login:
        existingUser.recordset.length > 0
          ? existingUser.recordset[0].first_login
          : userData.first_login,
      last_login: userData.last_login,
    };

    res.json({
      success: true,
      user: responseUser,
      isNewUser: existingUser.recordset.length === 0,
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Test user sync failed', {
      error: error instanceof Error ? error.message : String(error),
      oid: req.body?.oid,
    });
    res.status(500).json({ error: 'Failed to sync test user' });
  }
});

// Get current user information
router.get('/me', validateAzureToken, async (req: AuthRequest, res: Response) => {
  try {
    const oid = req.user?.oid;

    if (!oid) {
      return res.status(400).json({ error: 'OID is required in token claims' });
    }

    const result = await (sql as any).request().input('oid', sql.NVarChar, oid).query(`
        SELECT oid, name, email, preferred_username, tenant_id, roles, first_login, last_login, created_at
        FROM users
        WHERE oid = @oid
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.recordset[0];
    user.roles = JSON.parse(user.roles || '[]');

    logAuditEvent(
      AuditEventType.USER_INFO_ACCESS,
      {
        userId: oid,
        userEmail: user.email,
        accessedFields: [
          'oid',
          'name',
          'email',
          'preferred_username',
          'tenant_id',
          'roles',
          'first_login',
          'last_login',
        ],
      },
      req
    );

    res.json(user);
  } catch (error) {
    logger.error('Error getting user info', {
      error: error instanceof Error ? error.message : String(error),
      oid: req.user?.oid,
    });
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// Get user by OID (admin endpoint - could be restricted)
router.get('/:oid', validateAzureToken, async (req: AuthRequest, res: Response) => {
  try {
    const { oid } = req.params;
    const requesterOid = req.user?.oid;

    // Basic authorization check - users can only access their own data
    if (oid !== requesterOid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await (sql as any).request().input('oid', sql.NVarChar, oid).query(`
        SELECT oid, name, email, preferred_username, tenant_id, roles, first_login, last_login, created_at
        FROM users
        WHERE oid = @oid
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.recordset[0];
    user.roles = JSON.parse(user.roles || '[]');

    res.json(user);
  } catch (error) {
    logger.error('Error getting user by OID', {
      error: error instanceof Error ? error.message : String(error),
      requestedOid: req.params.oid,
      requesterOid: req.user?.oid,
    });
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;
