'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import { UserProfile } from '@/types';

// Create browser client for client-side operations
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  displayName: string | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  displayName: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch user profile
  const fetchUserProfile = async (userId: string) => {
    if (!isSupabaseConfigured) {
      // Mock profile for demo mode
      const mockProfile: UserProfile = {
        id: 'mock-profile-id',
        user_id: userId,
        username: 'testuser',
        firstname: 'Test',
        lastname: 'User',
        middlename: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setUserProfile(mockProfile);
      setDisplayName(mockProfile.username);
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('get_user_profile', { user_id: userId });
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      if (data) {
        setUserProfile(data);
        setDisplayName(data.username);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // In mock mode, set a default authenticated user
      const mockUser = {
        id: 'mock-user-id',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        aud: 'authenticated',
        role: 'authenticated',
        email_confirmed_at: new Date().toISOString(),
        phone_confirmed_at: null,
        confirmation_sent_at: null,
        recovery_sent_at: null,
        last_sign_in_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        identities: [],
        factors: []
      } as User;
      
      const mockSession = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: mockUser
      } as Session;
      
      setUser(mockUser);
      setSession(mockSession);
      fetchUserProfile(mockUser.id);
      setLoading(false);
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setDisplayName(null);
      }
      
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setUserProfile(null);
          setDisplayName(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    } else {
      // In mock mode, just clear the local state
      setUser(null);
      setSession(null);
      setUserProfile(null);
      setDisplayName(null);
    }
  };

  const value = {
    user,
    userProfile,
    displayName,
    session,
    loading,
    signOut,
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