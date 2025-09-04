import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Mock data store (shared with other routes)
interface MockVote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
  voter_ip: string;
  user_agent: string;
  created_at: string;
}

let mockVotes: MockVote[] = [];

/**
 * POST /api/polls/[id]/vote - Cast a vote on a specific poll
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('mock-auth-session');
    
    // Mock authentication check
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate session
    let sessionData;
    try {
      sessionData = JSON.parse(sessionCookie.value);
      // Check if session is expired
      if (sessionData.expires_at <= Math.floor(Date.now() / 1000)) {
        return NextResponse.json(
          { error: 'Session expired' },
          { status: 401 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const { id: pollId } = await params;
    const body = await request.json();
    const { optionId } = body;
    const mockUserId = sessionData.user.id;

    // Validate required fields
    if (!optionId) {
      return NextResponse.json(
        { error: 'Option ID is required' },
        { status: 400 }
      );
    }

    // Get client IP and user agent for tracking
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    // Mock poll validation (simplified)
    const validPollIds = ['poll-1', 'poll-2', 'poll-3'];
    if (!validPollIds.includes(pollId)) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    // Mock option validation
    const validOptions: Record<string, string[]> = {
      'poll-1': ['1', '2', '3'],
      'poll-2': ['4', '5'],
      'poll-3': ['6', '7', '8']
    };
    
    if (!validOptions[pollId]?.includes(optionId)) {
      return NextResponse.json(
        { error: 'Invalid option for this poll' },
        { status: 400 }
      );
    }

    // Check for existing vote
    const existingVoteIndex = mockVotes.findIndex(
      vote => vote.poll_id === pollId && vote.user_id === mockUserId
    );

    const voteId = `vote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (existingVoteIndex !== -1) {
      // Update existing vote (assuming polls allow vote changes)
      mockVotes[existingVoteIndex] = {
        ...mockVotes[existingVoteIndex],
        option_id: optionId,
        created_at: new Date().toISOString()
      };

      return NextResponse.json({
        success: true,
        message: 'Vote updated successfully',
        vote_id: mockVotes[existingVoteIndex].id
      });
    } else {
      // Create new vote
      const newVote: MockVote = {
        id: voteId,
        poll_id: pollId,
        option_id: optionId,
        user_id: mockUserId,
        voter_ip: clientIP,
        user_agent: userAgent,
        created_at: new Date().toISOString()
      };

      mockVotes.push(newVote);

      return NextResponse.json({
        success: true,
        message: 'Vote cast successfully',
        vote_id: voteId
      });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}