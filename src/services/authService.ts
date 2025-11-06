import { api } from '@/lib/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  role?: 'admin' | 'teacher' | 'staff';
  schoolName?: string;
  phoneNumber?: string;
}

export interface User {
  id: string;
  email: string;
  user_metadata?: {
    display_name?: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  role: 'admin' | 'teacher' | 'staff';
  school_name?: string;
  phone_number?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  profile: UserProfile;
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
}

class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/auth/register', data);
    return response.data;
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    const { user, profile, session } = response.data;
    
    // Store token and user data
    localStorage.setItem('auth_token', session.access_token);
    localStorage.setItem('user', JSON.stringify({ user, profile }));
    
    return response.data;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<{ user: User; profile: UserProfile }> {
    const response = await api.get('/auth/me');
    return response.data;
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const response = await api.put('/auth/profile', updates);
    return response.data.profile;
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<void> {
    await api.post('/auth/reset-password', { email });
  }

  /**
   * Update password
   */
  async updatePassword(newPassword: string): Promise<void> {
    await api.post('/auth/update-password', { newPassword });
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  /**
   * Get stored user data
   */
  getStoredUser(): { user: User; profile: UserProfile } | null {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }
}

export const authService = new AuthService();
export default authService;
