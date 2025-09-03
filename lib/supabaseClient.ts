import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Check if environment variables are properly configured
const isSupabaseConfigured = 
  supabaseUrl !== 'https://placeholder.supabase.co' && 
  supabaseUrl !== 'your-supabase-url-here' &&
  supabaseAnonKey !== 'placeholder-key' && 
  supabaseAnonKey !== 'your-supabase-anon-key-here';

// Create a safe Supabase client that won't crash if env vars are not set
let supabase: SupabaseClient | ReturnType<typeof createMockClient>;
try {
  if (isSupabaseConfigured) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } else {
    // Create a mock client for development
    supabase = createMockClient();
  }
} catch (error) {
  console.warn('Supabase client creation failed:', error);
  // Fallback mock client
  supabase = createMockClient();
}

function createMockClient() {
  return {
    auth: {
      signInWithPassword: () => Promise.resolve({ 
        data: { 
          user: { 
            id: 'mock-user-id', 
            email: 'test@example.com' 
          }, 
          session: { 
            user: { 
              id: 'mock-user-id', 
              email: 'test@example.com' 
            } 
          } 
        }, 
        error: null 
      }),
      signUp: () => Promise.resolve({ 
        data: { 
          user: { 
            id: 'mock-user-id', 
            email: 'test@example.com' 
          }, 
          session: { 
            user: { 
              id: 'mock-user-id', 
              email: 'test@example.com' 
            } 
          } 
        }, 
        error: null 
      }),
      signOut: () => Promise.resolve({ error: null }),
      getSession: () => Promise.resolve({ 
        data: { 
          session: {
            user: { 
              id: 'mock-user-id', 
              email: 'test@example.com' 
            }
          }
        }, 
        error: null 
      }),
      onAuthStateChange: () => ({ 
        data: { 
          subscription: { 
            unsubscribe: () => {} 
          } 
        } 
      })
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ 
            data: [
              {
                id: 'mock-poll-1',
                title: 'Sample Poll',
                description: 'This is a sample poll for testing',
                created_by: 'mock-user-id',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                is_active: true,
                allow_multiple_votes: false,
                is_anonymous: false,
                poll_options: [{ count: 2 }],
                votes: [{ count: 5 }]
              }
            ], 
            error: null 
          })
        })
      }),
      delete: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ error: null })
        })
      }),
      update: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ error: null })
        })
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: { id: 'mock-id' }, error: null })
        }),
        then: (callback: (value: { error: null }) => unknown) => Promise.resolve({ error: null }).then(callback),
        error: null
      })
    })
  };
}

export { supabase, isSupabaseConfigured };