declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Azure AD user claims interface
export interface AzureADClaims {
  oid: string;
  name: string;
  preferred_username?: string;
  upn?: string;
  tid?: string;
  roles?: string[];
  [key: string]: any;
}

// Database user interface
export interface User {
  oid: string;
  name: string;
  email: string;
  preferred_username?: string;
  tenant_id?: string;
  roles: string[];
  claims: AzureADClaims;
  first_login: Date;
  last_login: Date;
  created_at: Date;
  updated_at: Date;
}
