import express from 'express';

/**
 * Security headers middleware for Azure AD compliance
 * Implements essential security headers to protect against common web vulnerabilities
 */
export function securityHeaders(req: express.Request, res: express.Response, next: express.NextFunction) {
  // Content Security Policy - restrict resource loading
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self'; " +
    "connect-src 'self' https://login.microsoftonline.com https://graph.microsoft.com; " +
    "frame-ancestors 'none';"
  );

  // HTTP Strict Transport Security - enforce HTTPS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // X-Frame-Options - prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // X-Content-Type-Options - prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Referrer-Policy - control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy - restrict browser features
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
  );

  // Remove X-Powered-By header to avoid revealing server technology
  res.removeHeader('X-Powered-By');

  next();
}

/**
 * Additional security headers specifically for authentication endpoints
 */
export function authSecurityHeaders(req: express.Request, res: express.Response, next: express.NextFunction) {
  // Cache control for auth endpoints - prevent caching of sensitive data
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Additional CSP for auth endpoints - more restrictive
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self'; " +
    "style-src 'self'; " +
    "img-src 'self' data: https://login.microsoftonline.com; " +
    "font-src 'self'; " +
    "connect-src 'self' https://login.microsoftonline.com https://graph.microsoft.com; " +
    "frame-ancestors 'none'; " +
    "form-action 'self' https://login.microsoftonline.com;"
  );

  next();
}