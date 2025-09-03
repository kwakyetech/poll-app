'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
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
  const [options, setOptions] = useState<PollOption[]>([
    { id: '1', text: '' },
    { id: '2', text: '' }
  ]);
  const [expiresAt, setExpiresAt] = useState('');
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Redirect if not authenticated
  if (!user) {
    router.push('/auth/login');
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

    const validOptions = options.filter(option => option.text.trim());
    if (validOptions.length < 2) {
      setError('At least 2 options are required');
      return false;
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
      // Create the poll
      const { data: pollData, error: pollError } = await supabase
        .from('polls')
        .insert({
          title: title.trim(),
          description: description.trim(),
          created_by: user.id,
          expires_at: expiresAt,
          allow_multiple_votes: allowMultipleVotes,
          is_anonymous: isAnonymous
        })
        .select()
        .single();

      if (pollError) {
        throw pollError;
      }

      // Create poll options
      const validOptions = options.filter(option => option.text.trim());
      const optionsData = validOptions.map((option, index) => ({
        poll_id: pollData.id,
        option_text: option.text.trim(),
        option_order: index + 1
      }));

      const optionsResponse = await supabase
        .from('poll_options')
        .insert(optionsData);

      if (optionsResponse.error) {
        throw optionsResponse.error;
      }

      // Redirect to the created poll
      router.push(`/polls/${pollData.id}`);
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create New Poll
            </h1>
            <p className="text-gray-600">
              Create a poll to gather opinions from the community
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="What's your question?"
                maxLength={200}
                required
              />
              <p className="mt-1 text-sm text-gray-500">{title.length}/200 characters</p>
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
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Provide more context about your poll..."
                maxLength={500}
                required
              />
              <p className="mt-1 text-sm text-gray-500">{description.length}/500 characters</p>
            </div>

            {/* Poll Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poll Options * (minimum 2)
              </label>
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => updateOption(option.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                  className="mt-3"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Option
                </Button>
              )}
            </div>

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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500">When should this poll close?</p>
            </div>

            {/* Poll Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Poll Settings</h3>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowMultipleVotes"
                  checked={allowMultipleVotes}
                  onChange={(e) => setAllowMultipleVotes(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="allowMultipleVotes" className="ml-2 block text-sm text-gray-700">
                  Allow multiple votes per user
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isAnonymous"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isAnonymous" className="ml-2 block text-sm text-gray-700">
                  Anonymous voting (hide voter identities)
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="min-w-[120px]"
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