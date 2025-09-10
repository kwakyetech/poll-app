import { SecureUser } from './auth';

// TypeScript declaration for global variable
declare global {
  var pollsStore: any[];
  var usersStore: SecureUser[];
}

// Shared poll data store - use global to persist across module reloads in development
if (!global.pollsStore) {
  global.pollsStore = [
    {
      id: 'poll-1',
      title: 'Favorite Programming Language',
      description: 'What is your favorite programming language for web development?',
      poll_type: 'single' as const,
      options: [
        { id: 'opt-1', text: 'JavaScript', votes: 15 },
        { id: 'opt-2', text: 'TypeScript', votes: 23 },
        { id: 'opt-3', text: 'Python', votes: 8 },
        { id: 'opt-4', text: 'Go', votes: 5 }
      ],
      created_by: 'demo-user-1',
      created_at: new Date('2024-01-15T10:00:00Z'),
      is_active: true,
      allow_multiple_votes: false
    },
    {
      id: 'poll-2',
      title: 'Best Development Framework',
      description: 'Which framework do you prefer for building web applications? (Multiple votes allowed)',
      poll_type: 'multiple' as const,
      options: [
        { id: 'opt-5', text: 'React', votes: 32 },
        { id: 'opt-6', text: 'Vue.js', votes: 18 },
        { id: 'opt-7', text: 'Angular', votes: 12 },
        { id: 'opt-8', text: 'Svelte', votes: 7 }
      ],
      created_by: 'demo-user-1',
      created_at: new Date('2024-01-16T14:30:00Z'),
      is_active: true,
      allow_multiple_votes: true
    },
    {
      id: 'poll-test',
      title: 'Test Vote Recording',
      description: 'Testing if votes are recorded properly on newly created polls',
      poll_type: 'single' as const,
      options: [
        { id: 'poll-test-option-1', poll_id: 'poll-test', text: 'Option A', option_order: 1, votes: 0 },
        { id: 'poll-test-option-2', poll_id: 'poll-test', text: 'Option B', option_order: 2, votes: 0 }
      ],
      created_by: 'demo-user-1',
      created_at: new Date().toISOString(),
      is_active: true,
      allow_multiple_votes: false
    }
  ];
}

// Export functions to manage the shared store
export const getPolls = () => global.pollsStore;
export const addPoll = (poll: any) => {
  // Check if poll already exists to avoid duplicates
  const existingPoll = global.pollsStore.find(p => p.id === poll.id);
  if (!existingPoll) {
    global.pollsStore.push(poll);
    console.log('Added poll:', poll.id, 'Total polls:', global.pollsStore.length);
  }
  return poll;
};
export const findPoll = (id: string) => {
  const poll = global.pollsStore.find(p => p.id === id);
  console.log('Finding poll:', id, 'Found:', !!poll, 'Available polls:', global.pollsStore.map(p => p.id));
  return poll;
};

// Initialize secure users store
if (!global.usersStore) {
  global.usersStore = [
    {
      id: 'demo-user-1',
      username: 'demouser',
      email: 'demo@example.com',
      // Pre-hashed password for 'demo123' (bcrypt with 12 rounds)
      passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uDfG',
      createdAt: new Date('2024-01-01T00:00:00Z').toISOString()
    },
    {
      id: 'demo-user-2',
      username: 'testuser',
      email: 'test@example.com',
      // Pre-hashed password for 'test123' (bcrypt with 12 rounds)
      passwordHash: '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      createdAt: new Date('2024-01-02T00:00:00Z').toISOString()
    }
  ];
}

// Function to initialize users with proper password hashes
export async function initializeUsers() {
  const { hashPassword } = await import('./auth');
  
  // Only initialize if users don't have proper hashes
  if (global.usersStore[0].passwordHash.startsWith('$2b$12$LQv3c1yqBWVHxkd0LHAkCO')) {
    try {
      global.usersStore[0].passwordHash = await hashPassword('demo123');
      global.usersStore[1].passwordHash = await hashPassword('test123');
      console.log('Demo user passwords initialized successfully');
    } catch (error) {
      console.error('Failed to initialize demo passwords:', error);
    }
  }
}

// User helper functions
export const getUsers = () => global.usersStore;
export const addUser = (user: SecureUser) => {
  global.usersStore.push(user);
  return user;
};
export const findUserByEmail = (email: string) => {
  return global.usersStore.find(u => u.email === email);
};
export const findUserByUsername = (username: string) => {
  return global.usersStore.find(u => u.username === username);
};
export const findUserById = (id: string) => {
  return global.usersStore.find(u => u.id === id);
};
export const findUserByEmailOrUsername = (emailOrUsername: string) => {
  return global.usersStore.find(u => u.email === emailOrUsername || u.username === emailOrUsername);
};

// For backward compatibility
export const mockPolls = global.pollsStore;