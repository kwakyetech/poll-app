'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
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

      // Fetch polls from our API endpoint
      const response = await fetch('/api/polls');
      
      if (!response.ok) {
        throw new Error('Failed to fetch polls');
      }

      const data = await response.json();
      
      // Transform the data to match expected format
      const pollsWithCounts = data.map((poll: any) => ({
        ...poll,
        option_count: poll.options?.length || 0,
        vote_count: poll.total_votes || 0
      }));

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
      <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
      <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Polls</h3>
            <p className="text-red-600 mb-4 text-sm sm:text-base">{error}</p>
            <Button onClick={fetchPolls} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">All Polls</h1>
              <p className="mt-1 sm:mt-2 text-gray-600 text-sm sm:text-base">
                Discover and participate in community polls
              </p>
            </div>
            {user && (
              <Link href="/polls/create" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="sm:inline">Create Poll</span>
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Polls Grid */}
        {polls.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No polls found</h3>
            <p className="text-gray-600 mb-6 text-sm sm:text-base px-4">Be the first to create a poll and start gathering opinions!</p>
            {user && (
              <Link href="/polls/create">
                <Button>
                  Create Your First Poll
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {polls.map((poll) => {
              const expired = isExpired(poll.expires_at);
              
              return (
                <Link key={poll.id} href={`/polls/${poll.id}`}>
                  <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-4 sm:p-6 cursor-pointer border border-gray-200 hover:border-blue-300 h-full flex flex-col">
                    {/* Poll Status */}
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
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
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2 flex-grow">
                      {poll.title}
                    </h3>

                    {/* Poll Description */}
                    {poll.description && (
                      <p className="text-gray-600 text-xs sm:text-sm mb-4 line-clamp-2 sm:line-clamp-3">
                        {poll.description}
                      </p>
                    )}

                    {/* Poll Stats */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm text-gray-500 mb-4 gap-2">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <span className="flex items-center">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          {poll.option_count} options
                        </span>
                        <span className="flex items-center">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <div className="text-xs text-gray-400 space-y-1 mt-auto">
                      <div className="truncate">Created: {formatDate(poll.created_at)}</div>
                      <div className="truncate">Expires: {poll.expires_at ? formatDate(poll.expires_at) : 'No expiration'}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Load More Button (for future pagination) */}
        {polls.length > 0 && (
          <div className="mt-8 sm:mt-12 text-center">
            <Button variant="outline" onClick={fetchPolls} className="w-full sm:w-auto">
              Refresh Polls
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}