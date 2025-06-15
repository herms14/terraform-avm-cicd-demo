import { PublicClientApplication, Configuration, AuthenticationResult } from '@azure/msal-browser';

const msalConfig: Configuration = {
  auth: {
    clientId: process.env.REACT_APP_AZURE_CLIENT_ID || 'your-client-id',
    authority: `https://login.microsoftonline.com/${process.env.REACT_APP_AZURE_TENANT_ID || 'your-tenant-id'}`,
    redirectUri: process.env.REACT_APP_REDIRECT_URI || window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

export const loginRequest = {
  scopes: ['User.Read', 'https://management.azure.com/user_impersonation'],
};

export class AuthService {
  async login(): Promise<AuthenticationResult> {
    try {
      const loginResponse = await msalInstance.loginPopup(loginRequest);
      return loginResponse;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await msalInstance.logoutPopup();
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  async getAccessToken(): Promise<string> {
    try {
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const silentRequest = {
        ...loginRequest,
        account: accounts[0],
      };

      const response = await msalInstance.acquireTokenSilent(silentRequest);
      return response.accessToken;
    } catch (error) {
      console.error('Token acquisition failed:', error);
      // If silent token acquisition fails, try popup
      const response = await msalInstance.acquireTokenPopup(loginRequest);
      return response.accessToken;
    }
  }

  getCurrentUser() {
    const accounts = msalInstance.getAllAccounts();
    return accounts.length > 0 ? accounts[0] : null;
  }

  isAuthenticated(): boolean {
    return msalInstance.getAllAccounts().length > 0;
  }

  getUserRoles(): string[] {
    const account = this.getCurrentUser();
    if (!account?.idTokenClaims) {
      return [];
    }

    // Extract roles from token claims
    const claims = account.idTokenClaims as any;
    return claims.roles || claims.groups || [];
  }

  hasRole(role: string): boolean {
    return this.getUserRoles().includes(role);
  }

  canDeployResources(): boolean {
    return this.hasRole('Erdtree.ResourceDeployer') || this.hasRole('Erdtree.Admin');
  }

  canApproveDeployments(): boolean {
    return this.hasRole('Erdtree.Approver') || this.hasRole('Erdtree.Admin');
  }
}

export const authService = new AuthService();