import axios from 'axios';

export interface User {
  oid: string;
  name: string;
  email: string;
  preferred_username?: string;
  tenant_id?: string;
  roles: string[];
  first_login: string;
  last_login: string;
  created_at?: string;
  isNewUser?: boolean;
}

class UserService {
  private api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  async syncUser(getAccessToken: () => Promise<string>, getIdToken?: () => Promise<string | null>): Promise<User> {
    try {
      const token = await getAccessToken();
      
      // Try to get ID token which contains roles
      let headers: any = { Authorization: `Bearer ${token}` };
      if (getIdToken) {
        try {
          const idToken = await getIdToken();
          if (idToken) {
            headers['x-id-token'] = idToken;
          }
        } catch (error) {
          console.warn('Could not get ID token:', error);
          // Continue without ID token - roles may be in access token
        }
      }
      
      const response = await this.api.post('/users/sync', {}, { headers });
      return response.data.user;
    } catch (error) {
      console.error('User sync failed:', error);
      throw new Error('Failed to sync user with database');
    }
  }

  async getCurrentUser(getAccessToken: () => Promise<string>): Promise<User> {
    try {
      const token = await getAccessToken();
      const response = await this.api.get('/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw new Error('Failed to get user information');
    }
  }

  async getUserById(oid: string, getAccessToken: () => Promise<string>): Promise<User> {
    try {
      const token = await getAccessToken();
      const response = await this.api.get(`/users/${oid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get user by ID:', error);
      throw new Error('Failed to get user information');
    }
  }
}

export const userService = new UserService();