'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Secure User type
interface SecureUser {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

interface AuthContextType {
  user: SecureUser | null;
  displayName: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (usernameOrEmail: string, password: string) => Promise<boolean>;
  signUp: (userData: {
    username: string;
    email: string;
    password: string;
  }) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  displayName: null,
  loading: true,
  signOut: async () => {},
  signIn: async () => false,
  signUp: async () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SecureUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  const checkSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Session check error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const signIn = useCallback(async (usernameOrEmail: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ usernameOrEmail, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        return true;
      } else {
        const errorData = await response.json();
        console.error('Login failed:', errorData.error);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }, []);

  const signUp = useCallback(async (userData: {
    username: string;
    email: string;
    password: string;
  }): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        return true;
      } else {
        const errorData = await response.json();
        console.error('Registration failed:', errorData.error);
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  }, []);

  const displayName = user?.username || user?.email || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        displayName,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};