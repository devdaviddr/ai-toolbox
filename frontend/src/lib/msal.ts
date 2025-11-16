import { PublicClientApplication } from '@azure/msal-browser';

// Validate Azure AD configuration
const validateAzureConfig = () => {
  const clientId = import.meta.env.VITE_AZURE_CLIENT_ID;
  const tenantId = import.meta.env.VITE_AZURE_TENANT_ID;
  const apiScope = import.meta.env.VITE_API_SCOPE;

  if (!clientId || !tenantId) {
    throw new Error('Azure AD configuration is incomplete. Please check VITE_AZURE_CLIENT_ID and VITE_AZURE_TENANT_ID environment variables.');
  }

  // Basic UUID validation for client and tenant IDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(clientId)) {
    throw new Error('VITE_AZURE_CLIENT_ID must be a valid UUID.');
  }
  if (!uuidRegex.test(tenantId)) {
    throw new Error('VITE_AZURE_TENANT_ID must be a valid UUID.');
  }

  if (!apiScope || apiScope.trim() === '') {
    // VITE_API_SCOPE is not configured. Using default scope. Please configure your API scope for production use.
  }
};

const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || 'your-client-id',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || 'common'}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage' as const,
    storeAuthStateInCookie: true,
  },
};

// Validate configuration in development
if (import.meta.env.DEV) {
  validateAzureConfig();
}

export const msalInstance = new PublicClientApplication(msalConfig);

export const graphScopes = ['https://graph.microsoft.com/User.Read'];
export const apiScopes = [import.meta.env.VITE_API_SCOPE || 'api://default-audience/.default'].filter(Boolean);