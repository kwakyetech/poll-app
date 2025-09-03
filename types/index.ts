import { Session } from '@supabase/supabase-js';

// Database types matching Supabase schema
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  firstname: string;
  lastname: string;
  middlename?: string;
  created_at: string;
  updated_at: string;
}

// Core Poll types
export interface Poll {
  id: string;
  title: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  is_active: boolean;
  allow_multiple_votes: boolean;
  is_anonymous: boolean;
  options: PollOption[];
  option_count?: number;
  vote_count?: number;
}

export interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  option_order: number;
  created_at: string;
}

export interface Vote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id?: string; // Nullable for anonymous votes
  voter_ip?: string;
  user_agent?: string;
  created_at: string;
}

// Enhanced types for poll results
export interface PollOptionWithResults extends PollOption {
  vote_count: number;
  vote_percentage: number;
}

export interface PollWithResults extends Omit<Poll, 'options'> {
  is_expired: boolean;
  total_votes: number;
  options: PollOptionWithResults[];
  user_vote?: {
    option_id: string;
    voted_at: string;
  };
}

// API Response types
export interface VoteResponse {
  success: boolean;
  message?: string;
  error?: string;
  vote_id?: string;
}

export interface CreatePollResponse {
  success: boolean;
  message?: string;
  error?: string;
  poll_id?: string;
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
  allowMultipleVotes?: boolean;
  isAnonymous?: boolean;
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
  userProfile: UserProfile | null;
  displayName: string | null;
  session: Session | null;
  loading: boolean;
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

// Database response types with aggregations
export interface PollWithCounts {
  id: string;
  title: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  is_active: boolean;
  allow_multiple_votes: boolean;
  is_anonymous: boolean;
  poll_options: { count: number }[];
  votes: { count: number }[];
  option_count?: number;
  vote_count?: number;
}

// Extended Poll type for dashboard and polls pages
export interface PollWithCountsExtended extends PollWithCounts {
  options: PollOption[];
}

// Flexible type for database responses
export interface PollDatabaseResponse {
  id: string;
  title: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  is_active: boolean;
  allow_multiple_votes: boolean;
  is_anonymous: boolean;
  poll_options: { count: number }[];
  votes: { count: number }[];
}