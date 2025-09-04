import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getPolls, addPoll } from '@/lib/mockData';

/**
 * GET /api/polls - Fetch all polls or user-specific polls
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let polls = [...getPolls()];

    // Filter by user if userId is provided
    if (userId) {
      polls = polls.filter(poll => poll.created_by === userId);
    }

    // Filter only active polls
    polls = polls.filter(poll => poll.is_active);

    // Sort by created_at descending
    polls.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Map vote counts for consistency with individual poll API
    const pollsWithVoteCounts = polls.map(poll => ({
      ...poll,
      options: poll.options.map((option: any) => ({
        ...option,
        vote_count: option.votes // Map votes to vote_count for frontend consistency
      })),
      total_votes: poll.options.reduce((sum: number, option: any) => sum + option.votes, 0)
    }));

    return NextResponse.json({ data: pollsWithVoteCounts });
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
    
    // Debug logging
    console.log('Creating poll with data:', {
      title,
      pollType,
      allowMultipleVotes,
      optionsCount: options?.length || 0
    });

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
    const determinedPollType = pollType; // Keep the original pollType as frontend expects 'single', 'multiple', or 'text'
    console.log('Poll type mapping:', { received: pollType, determined: determinedPollType });
    
    const newPoll = {
      id: `poll-${getPolls().length + 1}`,
      title,
      description: description || '',
      poll_type: determinedPollType,
      created_by: sessionData.user.id,
      created_at: new Date().toISOString(),
      expires_at: expiresAt || null,
      allow_multiple_votes: allowMultipleVotes || false,
      is_anonymous: isAnonymous || false,
      is_active: true,
      options: []
    };

    // Create poll options (only for non-text polls)
    if (pollType !== 'text' && options && options.length > 0) {
      newPoll.options = options.map((option: string, index: number) => ({
        id: `${newPoll.id}-option-${index + 1}`,
        poll_id: newPoll.id,
        text: option,
        option_order: index + 1,
        votes: 0
      }));
    }

    // Add to mock database
    addPoll(newPoll);
    
    console.log('Created new poll:', {
      id: newPoll.id,
      title: newPoll.title,
      poll_type: newPoll.poll_type,
      options: newPoll.options.map(opt => ({ id: opt.id, text: opt.text, votes: opt.votes }))
    });

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