// User types
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// Poll types
export interface Poll {
  id: string;
  title: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  is_active: boolean;
  options: PollOption[];
}

export interface PollOption {
  id: string;
  poll_id: string;
  text: string;
  votes_count: number;
  created_at: string;
}

export interface Vote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface CreatePollFormData {
  title: string;
  description?: string;
  options: string[];
  expiresAt?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

// Auth Context types
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Component Props types
export interface NavbarProps {
  className?: string;
}

export interface PollCardProps {
  poll: Poll;
  onVote?: (optionId: string) => void;
  showResults?: boolean;
}

export interface PollResultsProps {
  poll: Poll;
  userVote?: Vote;
}