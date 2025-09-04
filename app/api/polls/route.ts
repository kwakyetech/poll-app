import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Mock data store (in a real app, this would be a database)
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
 * GET /api/polls - Fetch all polls or user-specific polls
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let polls = [...mockPolls];

    // Filter by user if userId is provided
    if (userId) {
      polls = polls.filter(poll => poll.created_by === userId);
    }

    // Filter only active polls
    polls = polls.filter(poll => poll.is_active);

    // Sort by created_at descending
    polls.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ data: polls });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/polls - Create a new poll
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { title, description, pollType, options, expiresAt, allowMultipleVotes, isAnonymous } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Validate options for non-text polls
    if (pollType !== 'text' && (!options || options.length < 2)) {
      return NextResponse.json(
        { error: 'At least 2 options are required for choice-based polls' },
        { status: 400 }
      );
    }

    // Create new poll
    const newPoll = {
      id: (mockPolls.length + 1).toString(),
      title,
      description: description || '',
      poll_type: pollType || 'single',
      created_by: sessionData.user.id,
      created_at: new Date().toISOString(),
      expires_at: expiresAt || null,
      allow_multiple_votes: allowMultipleVotes || false,
      is_anonymous: isAnonymous || false,
      is_active: true,
      options: [],
      votes: []
    };

    // Create poll options (only for non-text polls)
    if (pollType !== 'text' && options && options.length > 0) {
      newPoll.options = options.map((option: string, index: number) => ({
        id: `${newPoll.id}-${index + 1}`,
        poll_id: newPoll.id,
        option_text: option,
        option_order: index + 1,
        votes: []
      }));
    }

    // Add to mock database
    mockPolls.push(newPoll);

    return NextResponse.json(
      { data: newPoll, message: 'Poll created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}