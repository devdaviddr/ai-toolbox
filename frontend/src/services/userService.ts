import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

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

  constructor() {
    // Add request interceptor for auth tokens
    this.api.interceptors.request.use(async (config) => {
      const { getAccessToken } = useAuth();
      try {
        const token = await getAccessToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.warn('Failed to get access token for API request:', error);
      }
      return config;
    });
  }

  async syncUser(): Promise<User> {
    try {
      const response = await this.api.post('/users/sync');
      return response.data.user;
    } catch (error) {
      console.error('User sync failed:', error);
      throw new Error('Failed to sync user with database');
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await this.api.get('/users/me');
      return response.data;
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw new Error('Failed to get user information');
    }
  }

  async getUserById(oid: string): Promise<User> {
    try {
      const response = await this.api.get(`/users/${oid}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get user by ID:', error);
      throw new Error('Failed to get user information');
    }
  }
}

export const userService = new UserService();