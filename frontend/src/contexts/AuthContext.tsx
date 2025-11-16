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
      if (user) {
        const syncedUser = await userService.syncUser();
        setUserProfile(syncedUser);
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
      scopes: graphScopes,
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
        throw new Error('No accounts found');
      }

      const request = {
        scopes: apiScopes,
        account: accounts[0],
        forceRefresh: false, // Allow cached tokens
      };

      let response;
      try {
        // Try silent token acquisition first
        response = await msalInstance.acquireTokenSilent(request);
       } catch {
         // If silent acquisition fails, try interactive acquisition
         try {
           response = await msalInstance.acquireTokenPopup(request);
         } catch {
           // If both fail, user needs to login again
           throw new Error('Token acquisition failed. Please login again.');
         }
       }

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