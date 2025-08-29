import { useState, useEffect } from 'react';
import { Poll, Vote, ApiResponse } from '@/types';
import { useAuth } from '@/context/AuthContext';

/**
 * Custom hook for managing polls data and operations
 */
export function usePolls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch all polls
  const fetchPolls = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/polls');
      const data: ApiResponse<Poll[]> = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setPolls(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch polls');
    } finally {
      setLoading(false);
    }
  };

  // Create a new poll
  const createPoll = async (pollData: {
    title: string;
    description?: string;
    options: string[];
    expiresAt?: string;
  }) => {
    try {
      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pollData),
      });
      
      const data: ApiResponse<Poll> = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Add the new poll to the list
      if (data.data) {
        setPolls(prev => [data.data!, ...prev]);
      }
      
      return data.data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create poll');
    }
  };

  // Vote on a poll
  const vote = async (pollId: string, optionId: string) => {
    try {
      const response = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ optionId }),
      });
      
      const data: ApiResponse<Vote> = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Refresh polls to get updated vote counts
      await fetchPolls();
      
      return data.data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to vote');
    }
  };

  // Get user's polls
  const getUserPolls = async () => {
    if (!user) return [];
    
    try {
      const response = await fetch(`/api/polls?userId=${user.id}`);
      const data: ApiResponse<Poll[]> = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data.data || [];
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to fetch user polls');
    }
  };

  // Delete a poll
  const deletePoll = async (pollId: string) => {
    try {
      const response = await fetch(`/api/polls/${pollId}`, {
        method: 'DELETE',
      });
      
      const data: ApiResponse = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Remove the poll from the list
      setPolls(prev => prev.filter(poll => poll.id !== pollId));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete poll');
    }
  };

  // Load polls on mount
  useEffect(() => {
    fetchPolls();
  }, []);

  return {
    polls,
    loading,
    error,
    fetchPolls,
    createPoll,
    vote,
    getUserPolls,
    deletePoll,
    refetch: fetchPolls,
  };
}