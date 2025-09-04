import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { findPoll, getPolls } from '@/lib/mockData';

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
    const { id: pollId } = await params;
    const body = await request.json();
    const { optionId } = body;



    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('mock-auth-session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    let mockUserId: string;
    try {
      const sessionData = JSON.parse(sessionCookie.value);
      
      // Check if session is expired
      if (sessionData.expires_at <= Math.floor(Date.now() / 1000)) {
        return NextResponse.json(
          { error: 'Session expired' },
          { status: 401 }
        );
      }
      
      mockUserId = sessionData.user.id;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

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

    // Find the poll in the mock data store
    const poll = findPoll(pollId);
    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    // Validate that the option exists in this poll
    const validOptionIds = poll.options.map(option => option.id);
    if (!validOptionIds.includes(optionId)) {
      return NextResponse.json(
        { error: 'Invalid option for this poll' },
        { status: 400 }
      );
    }

    // Check for existing vote
    const existingVoteIndex = mockVotes.findIndex(
      vote => vote.poll_id === pollId && vote.user_id === mockUserId
    );

    // Check if user has already voted and poll doesn't allow multiple votes
    if (existingVoteIndex !== -1 && !poll.allow_multiple_votes) {
      return NextResponse.json(
        { error: 'You have already voted on this poll. Multiple votes are not allowed.' },
        { status: 400 }
      );
    }

    const voteId = `vote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Helper function to update vote counts in poll data
    const updatePollVoteCounts = (oldOptionId?: string, newOptionId?: string) => {
      const polls = getPolls();
      const pollIndex = polls.findIndex(p => p.id === pollId);
      console.log('Updating vote counts for poll:', pollId, 'Found poll at index:', pollIndex);
      
      if (pollIndex !== -1) {
        const poll = polls[pollIndex];
        console.log('Poll options before update:', poll.options.map(opt => ({ id: opt.id, text: opt.text, votes: opt.votes })));
        
        // Decrease count for old option (if updating vote)
        if (oldOptionId) {
          const oldOption = poll.options.find(opt => opt.id === oldOptionId);
          if (oldOption && oldOption.votes > 0) {
            oldOption.votes--;
            console.log('Decreased votes for option:', oldOptionId, 'New count:', oldOption.votes);
          }
        }
        
        // Increase count for new option
        if (newOptionId) {
          const newOption = poll.options.find(opt => opt.id === newOptionId);
          if (newOption) {
            newOption.votes++;
            console.log('Increased votes for option:', newOptionId, 'New count:', newOption.votes);
          } else {
            console.log('ERROR: Could not find option with ID:', newOptionId, 'Available options:', poll.options.map(opt => opt.id));
          }
        }
        
        console.log('Poll options after update:', poll.options.map(opt => ({ id: opt.id, text: opt.text, votes: opt.votes })));
      } else {
        console.log('ERROR: Could not find poll with ID:', pollId, 'Available polls:', polls.map(p => p.id));
      }
    };

    // Create new vote (either first time voting or multiple votes allowed)
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

    // Update vote counts in poll data
    updatePollVoteCounts(undefined, optionId);

    const message = existingVoteIndex !== -1 ? 'Additional vote cast successfully' : 'Vote cast successfully';

    return NextResponse.json({
      success: true,
      message: message,
      vote_id: voteId
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}