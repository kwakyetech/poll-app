'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

interface PollOption {
  id: string;
  text: string;
}

export default function CreatePollPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pollType, setPollType] = useState<'single' | 'multiple' | 'text'>('single');
  const [options, setOptions] = useState<PollOption[]>([
    { id: '1', text: '' },
    { id: '2', text: '' }
  ]);
  const [expiresAt, setExpiresAt] = useState('');
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  // Show loading or return null while redirecting
  if (!user) {
    return null;
  }

  const addOption = () => {
    const newId = (options.length + 1).toString();
    setOptions([...options, { id: newId, text: '' }]);
  };

  const removeOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter(option => option.id !== id));
    }
  };

  const updateOption = (id: string, text: string) => {
    setOptions(options.map(option =>
      option.id === id ? { ...option, text } : option
    ));
  };

  const validateForm = () => {
    if (!title.trim()) {
      setError('Poll title is required');
      return false;
    }

    if (!description.trim()) {
      setError('Poll description is required');
      return false;
    }

    // Only validate options for non-text polls
    if (pollType !== 'text') {
      const validOptions = options.filter(option => option.text.trim());
      if (validOptions.length < 2) {
        setError('At least 2 options are required');
        return false;
      }
    }

    if (!expiresAt) {
      setError('Expiration date is required');
      return false;
    }

    const expirationDate = new Date(expiresAt);
    if (expirationDate <= new Date()) {
      setError('Expiration date must be in the future');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare poll data
      const pollData = {
        title: title.trim(),
        description: description.trim(),
        pollType,
        options: pollType === 'text' ? [] : options.filter(option => option.text.trim()).map(option => option.text.trim()),
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        allowMultipleVotes,
        isAnonymous
      };

      // Debug logging
      console.log('Frontend sending poll data:', {
        pollType,
        allowMultipleVotes,
        title: title.trim()
      });

      // Create poll via API
      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(pollData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create poll');
      }

      const result = await response.json();

      // Redirect to the created poll
      router.push(`/polls/${result.data.id}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create poll';
      console.error('Error creating poll:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 16);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Create New Poll
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Create a poll to gather opinions from the community
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-start sm:items-center">
                <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5 sm:mt-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-800 text-sm sm:text-base">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Poll Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Poll Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
                placeholder="What's your question?"
                maxLength={200}
                required
              />
              <p className="mt-1 text-xs sm:text-sm text-gray-500">{title.length}/200 characters</p>
            </div>

            {/* Poll Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm resize-none"
                placeholder="Provide more context about your poll..."
                maxLength={500}
                required
              />
              <p className="mt-1 text-xs sm:text-sm text-gray-500">{description.length}/500 characters</p>
            </div>

            {/* Poll Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poll Type *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${pollType === 'single'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                  onClick={() => {
                    setPollType('single');
                    setAllowMultipleVotes(false);
                  }}
                >
                  <div className="flex items-center mb-2">
                    <input
                      type="radio"
                      name="pollType"
                      value="single"
                      checked={pollType === 'single'}
                      onChange={() => {
                        setPollType('single');
                        setAllowMultipleVotes(false);
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 font-medium text-gray-900">Single Choice</span>
                  </div>
                  <p className="text-sm text-gray-600">Users can select only one option</p>
                </div>

                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${pollType === 'multiple'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                  onClick={() => {
                    setPollType('multiple');
                    setAllowMultipleVotes(true);
                  }}
                >
                  <div className="flex items-center mb-2">
                    <input
                      type="radio"
                      name="pollType"
                      value="multiple"
                      checked={pollType === 'multiple'}
                      onChange={() => {
                        setPollType('multiple');
                        setAllowMultipleVotes(true);
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 font-medium text-gray-900">Multiple Choice</span>
                  </div>
                  <p className="text-sm text-gray-600">Users can select multiple options</p>
                </div>

                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${pollType === 'text'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                  onClick={() => {
                    setPollType('text');
                    setAllowMultipleVotes(false);
                  }}
                >
                  <div className="flex items-center mb-2">
                    <input
                      type="radio"
                      name="pollType"
                      value="text"
                      checked={pollType === 'text'}
                      onChange={() => {
                        setPollType('text');
                        setAllowMultipleVotes(false);
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 font-medium text-gray-900">Text Input</span>
                  </div>
                  <p className="text-sm text-gray-600">Users can type custom responses</p>
                </div>
              </div>
            </div>

            {/* Poll Options */}
            {pollType !== 'text' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Poll Options * (minimum 2)
                </label>
                <div className="space-y-2 sm:space-y-3">
                  {options.map((option, index) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => updateOption(option.id, e.target.value)}
                          className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
                          placeholder={`Option ${index + 1}`}
                          maxLength={100}
                        />
                      </div>
                      {options.length > 2 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOption(option.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0 h-12 w-12 sm:h-8 sm:w-8 p-0"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {options.length < 10 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addOption}
                    className="mt-3 w-full sm:w-auto"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Option
                  </Button>
                )}
              </div>
            )}

            {/* Text Input Poll Info */}
            {pollType === 'text' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1">Text Input Poll</h4>
                    <p className="text-sm text-blue-800">
                      Users will be able to submit their own text responses instead of choosing from predefined options.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Expiration Date */}
            <div>
              <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700 mb-2">
                Expiration Date & Time *
              </label>
              <input
                type="datetime-local"
                id="expiresAt"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                min={getMinDate()}
                className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
                required
              />
              <p className="mt-1 text-xs sm:text-sm text-gray-500">When should this poll close?</p>
            </div>

            {/* Poll Settings */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Poll Settings</h3>

              {/* Show info for single choice polls */}
              {pollType === 'single' && (
                <div className="p-3 sm:p-2 border border-gray-200 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    ✓ Users can select only one option
                  </p>
                </div>
              )}

              {/* Show info for multiple choice and text polls */}
              {pollType === 'multiple' && (
                <div className="p-3 sm:p-2 border border-blue-200 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    ✓ Multiple selection is enabled for this poll type
                  </p>
                </div>
              )}

              {pollType === 'text' && (
                <div className="p-3 sm:p-2 border border-green-200 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✓ Users can submit custom text responses
                  </p>
                </div>
              )}

              <div className="flex items-start sm:items-center p-3 sm:p-2 border border-gray-200 rounded-lg">
                <input
                  type="checkbox"
                  id="isAnonymous"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5 sm:mt-0 flex-shrink-0"
                />
                <label htmlFor="isAnonymous" className="ml-3 block text-sm text-gray-700 leading-relaxed">
                  Anonymous voting (hide voter identities)
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 sm:pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto sm:min-w-[120px] h-12 sm:h-10 text-base sm:text-sm"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    'Create Poll'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}