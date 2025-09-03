'use client';

import { useState, use, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { createBrowserClient } from '@supabase/ssr';

interface PollOption {
  id: string;
  option_text: string;
  option_order: number;
}

interface Poll {
  id: string;
  title: string;
  description?: string;
  options: PollOption[];
  is_expired?: boolean;
  total_votes?: number;
  allow_multiple_votes?: boolean;
  user_vote?: {
    option_id: string;
    voted_at: string;
  };
}

interface PollDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function PollDetailPage({ params }: PollDetailPageProps) {
  const { id } = use(params);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch poll data
  useEffect(() => {
    const fetchPoll = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/polls/${id}`);
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setPoll(data.data);
        
        // Check if user has already voted
        if (data.data.user_vote) {
          setHasVoted(true);
          setSelectedOption(data.data.user_vote.option_id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load poll');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPoll();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOption || !poll) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/polls/${id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ optionId: selectedOption }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setHasVoted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit vote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOptionChange = (optionId: string) => {
    setSelectedOption(optionId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 sm:py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 text-sm sm:text-base">Loading poll...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 sm:py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-medium text-red-800 mb-2">Error Loading Poll</h3>
            <p className="text-red-600 text-sm sm:text-base">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 sm:py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600 text-sm sm:text-base">Poll not found</p>
          </div>
        </div>
      </div>
    );
  }

  if (hasVoted) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 sm:py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Thank you for voting!</h1>
              <p className="text-gray-600 text-sm sm:text-base">Your vote has been recorded.</p>
            </div>
            <Button 
              onClick={() => {
                setHasVoted(false);
                setSelectedOption('');
              }}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Vote Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {poll.title}
            </h1>
            {poll.description && (
              <p className="text-gray-600 mb-2 text-sm sm:text-base">{poll.description}</p>
            )}
            <p className="text-xs sm:text-sm text-gray-500">Poll ID: {id}</p>
            {poll.total_votes !== undefined && (
              <p className="text-xs sm:text-sm text-gray-500">Total votes: {poll.total_votes}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              <fieldset>
                <legend className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">
                  Choose your option:
                </legend>
                <div className="space-y-2 sm:space-y-3">
                  {poll.options
                    .sort((a, b) => a.option_order - b.option_order)
                    .map((option) => (
                    <div key={option.id} className="flex items-start sm:items-center p-3 sm:p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        id={`option-${option.id}`}
                        name="poll-option"
                        type="radio"
                        value={option.id}
                        checked={selectedOption === option.id}
                        onChange={() => handleOptionChange(option.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mt-0.5 sm:mt-0 flex-shrink-0"
                      />
                      <label 
                        htmlFor={`option-${option.id}`} 
                        className="ml-3 block text-sm sm:text-base font-medium text-gray-700 cursor-pointer hover:text-gray-900 transition-colors leading-relaxed"
                      >
                        {option.option_text}
                      </label>
                    </div>
                  ))}
                </div>
              </fieldset>
            </div>

            <div className="pt-4 sm:pt-6 border-t border-gray-200">
              <Button 
                type="submit" 
                disabled={!selectedOption || isSubmitting}
                className="w-full h-12 sm:h-10 text-base sm:text-sm"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit Vote'
                )}
              </Button>
              
              {!selectedOption && (
                <p className="mt-2 text-xs sm:text-sm text-gray-500 text-center">
                  Please select an option to vote
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}