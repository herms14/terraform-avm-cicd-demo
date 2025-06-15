import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthenticationResult, EventType } from '@azure/msal-browser';
import { MsalProvider, useMsal } from '@azure/msal-react';
import { msalInstance, authService } from '../services/authService';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string>;
  canDeployResources: boolean;
  canApproveDeployments: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProviderInner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accounts } = useMsal();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (accounts.length > 0) {
      const account = accounts[0];
      const userRoles = authService.getUserRoles();
      
      setUser({
        id: account.homeAccountId,
        email: account.username,
        name: account.name || account.username,
        roles: userRoles,
      });
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [accounts]);

  const login = async () => {
    try {
      await authService.login();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getAccessToken = async () => {
    return authService.getAccessToken();
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    getAccessToken,
    canDeployResources: authService.canDeployResources(),
    canApproveDeployments: authService.canApproveDeployments(),
    loading,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-azure-500"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Handle redirect promise on app load
    msalInstance.handleRedirectPromise().catch((error) => {
      console.error('Redirect promise error:', error);
    });

    // Listen for login/logout events
    const callbackId = msalInstance.addEventCallback((event) => {
      if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
        const payload = event.payload as AuthenticationResult;
        console.log('Login successful:', payload.account?.username);
      }
    });

    return () => {
      if (callbackId) {
        msalInstance.removeEventCallback(callbackId);
      }
    };
  }, []);

  return (
    <MsalProvider instance={msalInstance}>
      <AuthProviderInner>{children}</AuthProviderInner>
    </MsalProvider>
  );
};