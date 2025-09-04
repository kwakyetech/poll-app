import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Mock data store (shared with main polls route)
let mockPolls: any[] = [
  {
    id: 'poll-1',
    title: 'Favorite Programming Language',
    description: 'What is your favorite programming language for web development?',
    poll_type: 'single',
    created_by: 'demo-user-1',
    created_at: new Date().toISOString(),
    expires_at: null,
    allow_multiple_votes: false,
    is_anonymous: false,
    is_active: true,
    options: [
      { id: '1', poll_id: 'poll-1', option_text: 'JavaScript', option_order: 1, votes: [] },
      { id: '2', poll_id: 'poll-1', option_text: 'TypeScript', option_order: 2, votes: [] },
      { id: '3', poll_id: 'poll-1', option_text: 'Python', option_order: 3, votes: [] },
      { id: '4', poll_id: 'poll-1', option_text: 'Go', option_order: 4, votes: [] }
    ],
    votes: []
  },
  {
    id: 'poll-2',
    title: 'Best Development Framework',
    description: 'Which framework do you prefer for building web applications?',
    poll_type: 'multiple',
    created_by: 'demo-user-1',
    created_at: new Date().toISOString(),
    expires_at: null,
    allow_multiple_votes: true,
    is_anonymous: true,
    is_active: true,
    options: [
      { id: '5', poll_id: 'poll-2', option_text: 'React', option_order: 1, votes: [] },
      { id: '6', poll_id: 'poll-2', option_text: 'Vue.js', option_order: 2, votes: [] },
      { id: '7', poll_id: 'poll-2', option_text: 'Angular', option_order: 3, votes: [] },
      { id: '8', poll_id: 'poll-2', option_text: 'Svelte', option_order: 4, votes: [] }
    ],
    votes: []
  }
];

/**
 * GET /api/polls/[id] - Fetch a specific poll by ID with options and results
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find the poll in our mock data
    const poll = mockPolls.find(p => p.id === id && p.is_active);

    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    // Calculate vote counts for each option
    const pollWithResults = {
      ...poll,
      options: poll.options.map((option: any) => ({
        ...option,
        vote_count: option.votes.length
      })),
      total_votes: poll.votes.length,
      is_expired: poll.expires_at ? new Date(poll.expires_at) < new Date() : false,
      user_vote: null // In a real app, this would check the current user's vote
    };

    return NextResponse.json({ data: pollWithResults });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/polls/[id] - Delete a specific poll (only by creator)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check for mock authentication session
    const cookieStore = await cookies();
    const mockSession = cookieStore.get('mock-auth-session');
    
    if (!mockSession) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    let sessionData;
    try {
      if (!mockSession.value || mockSession.value.trim() === '') {
        return NextResponse.json(
          { error: 'Empty session' },
          { status: 401 }
        );
      }
      sessionData = JSON.parse(mockSession.value);
      // Check if session is expired
      if (sessionData.expires_at <= Math.floor(Date.now() / 1000)) {
        return NextResponse.json(
          { error: 'Session expired' },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error('Session parsing error:', error, 'Cookie value:', mockSession.value);
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Find the poll
    const pollIndex = mockPolls.findIndex(p => p.id === id);
    
    if (pollIndex === -1) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    const poll = mockPolls[pollIndex];

    // Check if user is the creator
    if (poll.created_by !== sessionData.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only delete your own polls' },
        { status: 403 }
      );
    }

    // Delete the poll from mock data
    mockPolls.splice(pollIndex, 1);

    return NextResponse.json(
      { message: 'Poll deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}