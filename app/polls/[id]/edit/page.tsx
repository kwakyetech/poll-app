'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createBrowserClient } from '@supabase/ssr';
import { useAuth } from '@/context/AuthContext';
import { Poll, PollOption } from '@/types';

interface EditPollFormData {
  title: string;
  description: string;
  options: { id?: string; text: string; isNew?: boolean }[];
  expires_at: string;
  allow_multiple_votes: boolean;
  is_anonymous: boolean;
}

export default function EditPollPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const pollId = params.id as string;
  
  const [formData, setFormData] = useState<EditPollFormData>({
    title: '',
    description: '',
    options: [{ text: '' }, { text: '' }],
    expires_at: '',
    allow_multiple_votes: false,
    is_anonymous: false
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalPoll, setOriginalPoll] = useState<Poll | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    fetchPoll();
  }, [user, pollId]);

  const fetchPoll = async () => {
    try {
      setLoading(true);
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Fetch poll with options
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .select('*')
        .eq('id', pollId)
        .eq('created_by', user?.id)
        .single();

      if (pollError) throw pollError;
      if (!poll) throw new Error('Poll not found or you do not have permission to edit it');

      const { data: options, error: optionsError } = await supabase
        .from('poll_options')
        .select('*')
        .eq('poll_id', pollId)
        .order('created_at');

      if (optionsError) throw optionsError;

      setOriginalPoll(poll);
      setFormData({
        title: poll.title,
        description: poll.description || '',
        options: options.map(opt => ({ id: opt.id, text: opt.text })),
        expires_at: poll.expires_at ? new Date(poll.expires_at).toISOString().slice(0, 16) : '',
        allow_multiple_votes: poll.allow_multiple_votes,
        is_anonymous: poll.is_anonymous
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !originalPoll) return;

    // Validation
    if (!formData.title.trim()) {
      setError('Poll title is required');
      return;
    }

    const validOptions = formData.options.filter(opt => opt.text.trim());
    if (validOptions.length < 2) {
      setError('At least 2 options are required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Update poll
      const { error: pollError } = await supabase
        .from('polls')
        .update({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          expires_at: formData.expires_at || null,
          allow_multiple_votes: formData.allow_multiple_votes,
          is_anonymous: formData.is_anonymous
        })
        .eq('id', pollId)
        .eq('created_by', user.id);

      if (pollError) throw pollError;

      // Handle options updates
      const existingOptions = formData.options.filter(opt => opt.id && opt.text.trim());
      const newOptions = formData.options.filter(opt => !opt.id && opt.text.trim());
      const optionsToDelete = originalPoll ? 
        await supabase.from('poll_options').select('id').eq('poll_id', pollId) : { data: [] };
      
      const existingOptionIds = existingOptions.map(opt => opt.id);
      const toDelete = optionsToDelete.data?.filter(opt => !existingOptionIds.includes(opt.id)) || [];

      // Delete removed options
      if (toDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('poll_options')
          .delete()
          .in('id', toDelete.map(opt => opt.id));
        if (deleteError) throw deleteError;
      }

      // Update existing options
      for (const option of existingOptions) {
        const { error: updateError } = await supabase
          .from('poll_options')
          .update({ text: option.text.trim() })
          .eq('id', option.id);
        if (updateError) throw updateError;
      }

      // Insert new options
      if (newOptions.length > 0) {
        const { error: insertError } = await supabase
          .from('poll_options')
          .insert(
            newOptions.map(option => ({
              poll_id: pollId,
              text: option.text.trim()
            }))
          );
        if (insertError) throw insertError;
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { text: '' }]
    }));
  };

  const removeOption = (index: number) => {
    if (formData.options.length <= 2) return;
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const updateOption = (index: number, text: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => 
        i === index ? { ...opt, text } : opt
      )
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading poll...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !originalPoll) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Poll</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/dashboard')} variant="outline">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Edit Poll</h1>
            <p className="text-gray-600 mt-2">Update your poll details and options</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Poll Title *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your poll title"
                maxLength={200}
                required
              />
              <p className="text-xs text-gray-500 mt-1">{formData.title.length}/200 characters</p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Provide additional context for your poll"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">{formData.description.length}/500 characters</p>
            </div>

            {/* Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poll Options *
              </label>
              <div className="space-y-3">
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => updateOption(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Option ${index + 1}`}
                      maxLength={100}
                    />
                    {formData.options.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeOption(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {formData.options.length < 10 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addOption}
                  className="mt-3"
                >
                  Add Option
                </Button>
              )}
            </div>

            {/* Expiration Date */}
            <div>
              <label htmlFor="expires_at" className="block text-sm font-medium text-gray-700 mb-2">
                Expiration Date (Optional)
              </label>
              <input
                type="datetime-local"
                id="expires_at"
                value={formData.expires_at}
                onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Poll Settings</h3>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allow_multiple_votes"
                  checked={formData.allow_multiple_votes}
                  onChange={(e) => setFormData(prev => ({ ...prev, allow_multiple_votes: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="allow_multiple_votes" className="ml-2 block text-sm text-gray-700">
                  Allow multiple votes per user
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_anonymous"
                  checked={formData.is_anonymous}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_anonymous: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_anonymous" className="ml-2 block text-sm text-gray-700">
                  Anonymous voting (hide voter identities)
                </label>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto"
              >
                {saving ? 'Saving Changes...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}