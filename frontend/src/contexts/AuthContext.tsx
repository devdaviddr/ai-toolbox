import React, { createContext, useState, useEffect, ReactNode } from 'react';
import type { AuthenticationResult } from '@azure/msal-browser';
import { msalInstance, graphScopes, apiScopes } from '../lib/msal';

interface AuthContextType {
  user: any;
  login: () => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  getAccessToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeMsal = async () => {
      try {
        await msalInstance.initialize();
        const response = await msalInstance.handleRedirectPromise();
        if (response) {
          setUser(response.account);
        } else {
          const accounts = msalInstance.getAllAccounts();
          if (accounts.length > 0) {
            setUser(accounts[0]);
          }
        }
      } catch (error) {
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
      } catch (silentError) {
        // If silent acquisition fails, try interactive acquisition
        try {
          response = await msalInstance.acquireTokenPopup(request);
        } catch (interactiveError) {
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
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, loading, getAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };