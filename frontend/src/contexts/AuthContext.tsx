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
        console.log('MSAL redirect response', response);
        if (response) {
          setUser(response.account);
          console.log('User set from redirect', response.account);
        } else {
          const accounts = msalInstance.getAllAccounts();
          console.log('MSAL accounts', accounts);
          if (accounts.length > 0) {
            setUser(accounts[0]);
            console.log('User set from accounts', accounts[0]);
          }
        }
      } catch (error) {
        console.error('MSAL initialization failed', error);
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
      };

      const response = await msalInstance.acquireTokenSilent(request);
      return response.accessToken;
    } catch (error) {
      console.error('Failed to get access token', error);
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