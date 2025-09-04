'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '@/types';

// Mock User type (simplified version without Supabase dependencies)
interface MockUser {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// Mock Session type
interface MockSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: string;
  user: MockUser;
}

interface AuthContextType {
  user: MockUser | null;
  userProfile: UserProfile | null;
  displayName: string | null;
  session: MockSession | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (usernameOrEmail: string, password: string) => Promise<boolean>;
  signUp: (userData: {
    username: string;
    firstname: string;
    lastname: string;
    middlename?: string;
    email: string;
    password: string;
  }) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  displayName: null,
  session: null,
  loading: true,
  signOut: async () => {},
  signIn: async () => false,
  signUp: async () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [session, setSession] = useState<MockSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock users database (in a real app, this would be in a backend)
  const [mockUsers] = useState<Array<{
    user: MockUser;
    profile: UserProfile;
    password: string;
  }>>([{
    user: {
      id: 'demo-user-1',
      email: 'demo@example.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    profile: {
      id: 'demo-profile-1',
      user_id: 'demo-user-1',
      username: 'demouser',
      firstname: 'Demo',
      lastname: 'User',
      middlename: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    password: 'demo123'
  }]);

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = () => {
      const savedSession = localStorage.getItem('mock-auth-session');
      if (savedSession) {
        try {
          const parsedSession = JSON.parse(savedSession);
          if (parsedSession.expires_at > Math.floor(Date.now() / 1000)) {
            setSession(parsedSession);
            setUser(parsedSession.user);
            
            // Find and set user profile
            const userData = mockUsers.find(u => u.user.id === parsedSession.user.id);
            if (userData) {
              setUserProfile(userData.profile);
              setDisplayName(userData.profile.username);
            }
            
            // Ensure cookie is also set for middleware
            document.cookie = `mock-auth-session=${JSON.stringify(parsedSession)}; path=/; max-age=${parsedSession.expires_at - Math.floor(Date.now() / 1000)}; SameSite=Lax`;
          } else {
            localStorage.removeItem('mock-auth-session');
            document.cookie = 'mock-auth-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          }
        } catch (error) {
          console.error('Error parsing saved session:', error);
          localStorage.removeItem('mock-auth-session');
          document.cookie = 'mock-auth-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
      }
      setLoading(false);
    };

    checkExistingSession();
  }, [mockUsers]);

  const signIn = async (usernameOrEmail: string, password: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Find user by username or email
    const userData = mockUsers.find(u => 
      u.profile.username === usernameOrEmail || 
      u.user.email === usernameOrEmail
    );
    
    if (userData && userData.password === password) {
      const mockSession: MockSession = {
        access_token: 'mock-token-' + Date.now(),
        refresh_token: 'mock-refresh-' + Date.now(),
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: userData.user
      };
      
      setUser(userData.user);
      setSession(mockSession);
      setUserProfile(userData.profile);
      setDisplayName(userData.profile.username);
      
      // Save session to localStorage
      localStorage.setItem('mock-auth-session', JSON.stringify(mockSession));
      
      // Also set cookie for middleware
      document.cookie = `mock-auth-session=${JSON.stringify(mockSession)}; path=/; max-age=3600; SameSite=Lax`;
      
      return true;
    }
    
    return false;
  };

  const signUp = async (userData: {
    username: string;
    firstname: string;
    lastname: string;
    middlename?: string;
    email: string;
    password: string;
  }): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if username or email already exists
    const existingUser = mockUsers.find(u => 
      u.profile.username === userData.username || 
      u.user.email === userData.email
    );
    
    if (existingUser) {
      return false; // User already exists
    }
    
    // In a real app, this would create the user in the backend
    // For demo purposes, we'll just simulate success
    console.log('Mock user registration:', userData);
    
    return true;
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    setUserProfile(null);
    setDisplayName(null);
    localStorage.removeItem('mock-auth-session');
    
    // Clear cookie
    document.cookie = 'mock-auth-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  };

  const value = {
    user,
    userProfile,
    displayName,
    session,
    loading,
    signOut,
    signIn,
    signUp,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};