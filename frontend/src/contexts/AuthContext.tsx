import { createContext, useState, useEffect, type ReactNode } from 'react';
import { msalInstance, graphScopes, apiScopes } from '../lib/msal';
import { userService, type User } from '../services/userService';

export interface AuthContextType {
  user: any;
  userProfile: User | null;
  login: () => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  getAccessToken: () => Promise<string>;
  syncUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

   const syncUser = async () => {
     try {
       // Check if we have valid accounts before trying to sync
       const accounts = msalInstance.getAllAccounts();
       if (accounts.length === 0) {
         console.log('No authenticated accounts, using development sync');
         // Use development endpoint when not authenticated
         // Use stable dev user OID so it gets reused (not a new one each time)
         const mockUserData = {
           oid: 'dev-user-000',
           name: 'Development User',
           email: 'dev@example.com',
           preferred_username: 'dev@example.com',
           tenant_id: 'dev-tenant',
           roles: ['user']
         };

         const response = await fetch('http://localhost:3001/users/sync-dev', {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
           },
           body: JSON.stringify(mockUserData),
         });

         if (!response.ok) {
           throw new Error(`HTTP error! status: ${response.status}`);
         }

         const data = await response.json();
         setUserProfile(data.user);
         return;
       }

       // Try to get access token for authenticated users
       try {
         const token = await getAccessToken();
         // Successfully got token, use authenticated sync
         const syncedUser = await userService.syncUser(() => Promise.resolve(token));
         setUserProfile(syncedUser);
       } catch (error) {
         console.log('Token acquisition failed, falling back to dev endpoint:', error);
         // Fallback to dev endpoint if token acquisition fails
         // Use stable dev user OID so it gets reused
         const mockUserData = {
           oid: 'dev-user-000',
           name: 'Development User',
           email: 'dev@example.com',
           preferred_username: 'dev@example.com',
           tenant_id: 'dev-tenant',
           roles: ['user']
         };

         const response = await fetch('http://localhost:3001/users/sync-dev', {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
           },
           body: JSON.stringify(mockUserData),
         });

         if (!response.ok) {
           throw new Error(`HTTP error! status: ${response.status}`);
         }

         const data = await response.json();
         setUserProfile(data.user);
       }
     } catch (error) {
       console.warn('User sync failed:', error);
       // Don't throw - sync failures shouldn't break the app
     }
   };

  useEffect(() => {
    const initializeMsal = async () => {
      try {
        await msalInstance.initialize();
        const response = await msalInstance.handleRedirectPromise();
        if (response) {
          setUser(response.account);
          // Sync user to database after successful login
          setTimeout(() => syncUser(), 100); // Small delay to ensure state is set
        } else {
          const accounts = msalInstance.getAllAccounts();
          if (accounts.length > 0) {
            setUser(accounts[0]);
            // Sync user to database on app load
            setTimeout(() => syncUser(), 100);
          }
        }
      } catch {
        // MSAL initialization failed - user will need to login
      } finally {
        setLoading(false);
      }
    };

    initializeMsal();
  }, []);

   const login = async () => {
     const loginRequest = {
       // Include both Graph scopes (for user profile) and API scopes (for backend access)
       scopes: [...graphScopes, ...apiScopes],
       prompt: 'select_account',
     };

     await msalInstance.loginRedirect(loginRequest);
   };

  const logout = () => {
    msalInstance.logoutRedirect();
  };

   const getAccessToken = async () => {
     try {
       const accounts = msalInstance.getAllAccounts();
       if (accounts.length === 0) {
         throw new Error('No accounts found. Please login first.');
       }

       const request = {
         scopes: apiScopes,
         account: accounts[0],
         forceRefresh: false, // Allow cached tokens
       };

       const response = await msalInstance.acquireTokenSilent(request);
       return response.accessToken;
     } catch (error) {
       // Clear user state on token failure
       setUser(null);
       throw error;
     }
   };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      login,
      logout,
      isAuthenticated,
      loading,
      getAccessToken,
      syncUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };