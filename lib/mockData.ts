// Shared poll data store
let pollsStore = [
  {
    id: 'poll-1',
    title: 'Favorite Programming Language',
    description: 'What is your favorite programming language for web development?',
    poll_type: 'multiple_choice' as const,
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
    description: 'Which framework do you prefer for building web applications?',
    poll_type: 'multiple_choice' as const,
    options: [
      { id: 'opt-5', text: 'React', votes: 32 },
      { id: 'opt-6', text: 'Vue.js', votes: 18 },
      { id: 'opt-7', text: 'Angular', votes: 12 },
      { id: 'opt-8', text: 'Svelte', votes: 7 }
    ],
    created_by: 'demo-user-2',
    created_at: new Date('2024-01-16T14:30:00Z'),
    is_active: true,
    allow_multiple_votes: false
  }
];

// Export functions to manage the shared store
export const getPolls = () => pollsStore;
export const addPoll = (poll: any) => {
  pollsStore.push(poll);
  return poll;
};
export const findPoll = (id: string) => pollsStore.find(p => p.id === id);

// For backward compatibility
export const mockPolls = pollsStore;