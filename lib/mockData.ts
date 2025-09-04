// TypeScript declaration for global variable
declare global {
  var pollsStore: any[];
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

// For backward compatibility
export const mockPolls = global.pollsStore;