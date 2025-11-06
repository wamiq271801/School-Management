import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, type User, type UserProfile } from '@/services/authService';

interface RegisterData {
  email: string;
  password: string;
  displayName?: string;
  role?: 'admin' | 'teacher' | 'staff';
  schoolName?: string;
  phoneNumber?: string;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string, additionalData?: Partial<RegisterData>) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string): Promise<void> => {
    const { user, profile } = await authService.login({ email, password });
    setCurrentUser(user);
    setUserProfile(profile);
  };

  const register = async (
    email: string, 
    password: string, 
    displayName?: string,
    additionalData?: Partial<RegisterData>
  ): Promise<void> => {
    const registerData = {
      email,
      password,
      displayName: displayName || email.split('@')[0],
      role: additionalData?.role || 'admin',
      schoolName: additionalData?.schoolName || localStorage.getItem('school_name') || 'SmartSchool',
      phoneNumber: additionalData?.phoneNumber
    };

    const { user, profile } = await authService.register(registerData);
    setCurrentUser(user);
    setUserProfile(profile);
  };

  const logout = async (): Promise<void> => {
    await authService.logout();
    setCurrentUser(null);
    setUserProfile(null);
  };

  const resetPassword = async (email: string): Promise<void> => {
    await authService.resetPassword(email);
  };

  const loginWithGoogle = async (): Promise<void> => {
    // Google OAuth not implemented in backend yet
    throw new Error('Google login not yet implemented with Supabase');
  };

  const updateUserProfile = async (displayName: string): Promise<void> => {
    const updatedProfile = await authService.updateProfile({ display_name: displayName });
    setUserProfile(updatedProfile);
  };

  const refreshUserProfile = async (): Promise<void> => {
    const { user, profile } = await authService.getCurrentUser();
    setCurrentUser(user);
    setUserProfile(profile);
  };

  useEffect(() => {
    // Check for existing session on mount
    const initAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const { user, profile } = await authService.getCurrentUser();
          setCurrentUser(user);
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear invalid session
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    login,
    register,
    logout,
    resetPassword,
    loginWithGoogle,
    updateUserProfile,
    refreshUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
