'use client';

import { useState, use, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface PollOption {
  id: string;
  option_text: string;
  option_order: number;
  vote_count?: number;
}

interface Poll {
  id: string;
  title: string;
  description?: string;
  options: PollOption[];
  is_expired?: boolean;
  total_votes?: number;
  allow_multiple_votes?: boolean;
  poll_type?: 'single' | 'multiple' | 'text';
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
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [textResponse, setTextResponse] = useState<string>('');
  const [showResults, setShowResults] = useState(false);
  const [textResponses, setTextResponses] = useState<any[]>([]);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchTextResponses = async () => {
    if (!poll || poll.poll_type !== 'text') return;
    
    try {
      const response = await fetch(`/api/polls/${id}/text-response`);
      const data = await response.json();
      
      if (!data.error) {
        setTextResponses(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch text responses:', err);
    }
  };

  // Fetch poll data function - moved outside useEffect to be accessible
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
        // Handle both single and multiple votes
        if (Array.isArray(data.data.user_vote)) {
          setSelectedOptions(data.data.user_vote.map((vote: any) => vote.option_id));
        } else {
          setSelectedOptions([data.data.user_vote.option_id]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load poll');
    } finally {
      setLoading(false);
    }
  };

  // Fetch poll data on component mount
  useEffect(() => {
    fetchPoll();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!poll) {
      return;
    }

    // Validate based on poll type
    if (poll.poll_type === 'text') {
      if (!textResponse.trim()) {
        return;
      }
    } else {
      if (selectedOptions.length === 0) {
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      if (poll.poll_type === 'text') {
        // Submit text response
        const response = await fetch(`/api/polls/${id}/text-response`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ responseText: textResponse.trim() }),
        });
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
      } else {
        // For multiple votes, send each vote separately
        if (poll.allow_multiple_votes && selectedOptions.length > 1) {
          for (const optionId of selectedOptions) {
            const response = await fetch(`/api/polls/${id}/vote`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ optionId }),
            });
            
            const data = await response.json();
            
            if (data.error) {
              throw new Error(data.error);
            }
          }
        } else {
          // Single vote
          const response = await fetch(`/api/polls/${id}/vote`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ optionId: selectedOptions[0] }),
          });
          
          const data = await response.json();
          
          if (data.error) {
            throw new Error(data.error);
          }
        }
        
        // Refresh poll data to get updated vote counts and show results
        await fetchPoll();
        setShowResults(true);
      }
      
      setHasVoted(true);
      
      // Fetch text responses if it's a text poll to show results
      if (poll.poll_type === 'text') {
        await fetchTextResponses();
        setShowResults(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit response');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOptionChange = (optionId: string, allowMultiple?: boolean) => {
    if (allowMultiple) {
      setSelectedOptions(prev => 
        prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
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
          <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
            {/* Thank you message */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Thank you for {poll.poll_type === 'text' ? 'responding' : 'voting'}!</h1>
              <p className="text-gray-600 text-sm sm:text-base">Your {poll.poll_type === 'text' ? 'response' : 'vote'} has been recorded.</p>
            </div>

            {/* Results Section */}
            {showResults && (
              <div className="mb-8">
                <div className="border-t pt-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
                    {poll.poll_type === 'text' ? 'Responses' : 'Results'}
                  </h2>
                  
                  {poll.poll_type === 'text' ? (
                    // Text responses display
                    <div className="space-y-4">
                      {textResponses.length > 0 ? (
                        <>
                          <p className="text-sm text-gray-600 mb-4">
                            {textResponses.length} response{textResponses.length !== 1 ? 's' : ''} so far
                          </p>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {textResponses.map((response, index) => (
                              <div key={response.id || index} className="bg-gray-50 rounded-lg p-4">
                                <p className="text-gray-800 text-sm sm:text-base">{response.response_text}</p>
                                <p className="text-xs text-gray-500 mt-2">
                                  {new Date(response.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="text-gray-500 text-center py-8">No responses yet. Be the first to respond!</p>
                      )}
                    </div>
                  ) : (
                    // Vote results display
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 mb-4">
                        Total votes: {poll.total_votes || 0}
                      </p>
                      <div className="space-y-3">
                        {poll.options
                          .sort((a, b) => a.option_order - b.option_order)
                          .map((option) => {
                            const voteCount = option.vote_count || 0;
                            const percentage = poll.total_votes > 0 
                              ? Math.round((voteCount / poll.total_votes) * 100) 
                              : 0;
                            
                            return (
                              <div key={option.id} className="bg-gray-50 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-medium text-gray-900">{option.option_text}</span>
                                  <span className="text-sm text-gray-600">
                                    {voteCount} vote{voteCount !== 1 ? 's' : ''} ({percentage}%)
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Vote Again Button */}
            <div className="text-center">
              <Button 
                onClick={() => {
                  setHasVoted(false);
                  setSelectedOptions([]);
                  setTextResponse('');
                  setShowResults(false);
                  setTextResponses([]);
                }}
                variant="outline"
                className="w-full sm:w-auto"
              >
                {poll.poll_type === 'text' ? 'Respond Again' : 'Vote Again'}
              </Button>
            </div>
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
            {poll.poll_type === 'text' ? (
              // Text input poll interface
              <div className="space-y-3 sm:space-y-4">
                <fieldset>
                  <legend className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">
                    Share your response:
                  </legend>
                  <div className="space-y-2 sm:space-y-3">
                    <textarea
                      id="text-response"
                      value={textResponse}
                      onChange={(e) => setTextResponse(e.target.value)}
                      placeholder="Type your response here..."
                      rows={4}
                      maxLength={1000}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical min-h-[100px] text-sm sm:text-base"
                    />
                    <div className="flex justify-between items-center text-xs sm:text-sm text-gray-500">
                      <span>Maximum 1000 characters</span>
                      <span className={textResponse.length > 900 ? 'text-orange-600 font-medium' : ''}>
                        {textResponse.length}/1000
                      </span>
                    </div>
                  </div>
                </fieldset>
              </div>
            ) : (
              // Choice poll interface
              <div className="space-y-3 sm:space-y-4">
                <fieldset>
                  <legend className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">
                    Choose your option:
                  </legend>
                  <div className="space-y-2 sm:space-y-3">
                    {poll.allow_multiple_votes && (
                      <p className="text-sm text-blue-600 font-medium mb-3">
                        ✓ You can select multiple options
                      </p>
                    )}
                    {poll.options
                      .sort((a, b) => a.option_order - b.option_order)
                      .map((option) => (
                      <div key={option.id} className="flex items-start sm:items-center p-3 sm:p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <input
                          id={`option-${option.id}`}
                          name={poll.allow_multiple_votes ? undefined : "poll-option"}
                          type={poll.allow_multiple_votes ? "checkbox" : "radio"}
                          value={option.id}
                          checked={selectedOptions.includes(option.id)}
                          onChange={() => handleOptionChange(option.id, poll.allow_multiple_votes)}
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
            )}

            <div className="pt-4 sm:pt-6 border-t border-gray-200">
              <Button 
                type="submit" 
                disabled={(
                  poll.poll_type === 'text' 
                    ? !textResponse.trim() 
                    : selectedOptions.length === 0
                ) || isSubmitting}
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
                  poll.poll_type === 'text' ? 'Submit Response' : 'Submit Vote'
                )}
              </Button>
              
              {poll.poll_type === 'text' ? (
                !textResponse.trim() && (
                  <p className="mt-2 text-xs sm:text-sm text-gray-500 text-center">
                    Please enter your response
                  </p>
                )
              ) : (
                <>
                  {selectedOptions.length === 0 && (
                    <p className="mt-2 text-xs sm:text-sm text-gray-500 text-center">
                      Please select {poll.allow_multiple_votes ? 'one or more options' : 'an option'} to vote
                    </p>
                  )}
                  {poll.allow_multiple_votes && selectedOptions.length > 0 && (
                    <p className="mt-2 text-xs sm:text-sm text-blue-600 text-center">
                      {selectedOptions.length} option{selectedOptions.length > 1 ? 's' : ''} selected
                    </p>
                  )}
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}