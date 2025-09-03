'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createBrowserClient } from '@supabase/ssr';
import { useAuth } from '@/context/AuthContext';
import { PollWithCountsExtended } from '@/types';

export default function PollsPage() {
  const { user } = useAuth();
  const [polls, setPolls] = useState<PollWithCountsExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create Supabase client for browser
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Fetch polls with option and vote counts
      const { data, error } = await supabase
        .from('polls')
        .select(`
          *,
          poll_options(count),
          votes(count)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform the data to include counts
      const pollsWithCounts = data?.map((poll: PollWithCountsExtended) => ({
        ...poll,
        options: [], // Initialize with empty options array
        option_count: poll.poll_options?.[0]?.count || 0,
        vote_count: poll.votes?.[0]?.count || 0
      })) || [];

      setPolls(pollsWithCounts);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load polls';
      console.error('Error fetching polls:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expiresAt: string | undefined) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading polls...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Polls</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchPolls} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Polls</h1>
              <p className="mt-2 text-gray-600">
                Discover and participate in community polls
              </p>
            </div>
            {user && (
              <Link href="/polls/create">
                <Button>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Poll
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Polls Grid */}
        {polls.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No polls found</h3>
            <p className="text-gray-600 mb-6">Be the first to create a poll and start gathering opinions!</p>
            {user && (
              <Link href="/polls/create">
                <Button>
                  Create Your First Poll
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {polls.map((poll) => {
              const expired = isExpired(poll.expires_at);
              
              return (
                <Link key={poll.id} href={`/polls/${poll.id}`}>
                  <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 cursor-pointer border border-gray-200 hover:border-blue-300">
                    {/* Poll Status */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        expired 
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {expired ? 'Expired' : 'Active'}
                      </span>
                      {poll.is_anonymous && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Anonymous
                        </span>
                      )}
                    </div>

                    {/* Poll Title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {poll.title}
                    </h3>

                    {/* Poll Description */}
                    {poll.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {poll.description}
                      </p>
                    )}

                    {/* Poll Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          {poll.option_count} options
                        </span>
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {poll.vote_count} votes
                        </span>
                      </div>
                      {poll.allow_multiple_votes && (
                        <span className="text-blue-600 text-xs font-medium">
                          Multiple votes
                        </span>
                      )}
                    </div>

                    {/* Poll Dates */}
                    <div className="text-xs text-gray-400 space-y-1">
                      <div>Created: {formatDate(poll.created_at)}</div>
                      <div>Expires: {poll.expires_at ? formatDate(poll.expires_at) : 'No expiration'}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Load More Button (for future pagination) */}
        {polls.length > 0 && (
          <div className="mt-12 text-center">
            <Button variant="outline" onClick={fetchPolls}>
              Refresh Polls
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}