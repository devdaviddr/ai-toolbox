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
         console.log('No authenticated accounts - skipping user sync');
         // Don't use dev endpoint - require real authentication
         return;
       }

       // Try to get access token for authenticated users
       const token = await getAccessToken();
       console.log('Got access token, syncing user...');
       
       // Successfully got token, use authenticated sync
       const syncedUser = await userService.syncUser(() => Promise.resolve(token));
       setUserProfile(syncedUser);
       console.log('User synced successfully:', syncedUser);
     } catch (error) {
       console.error('User sync failed:', error);
       // Don't throw - sync failures shouldn't break the app, but DO log them
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
       // Use only API scopes, not Graph scopes
       scopes: apiScopes,
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