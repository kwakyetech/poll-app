import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getPolls, findPoll, mockPolls } from '@/lib/mockData';

/**
 * PUT /api/polls/[id] - Update poll content (title, description, options)
 */
export async function PUT(
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
     const body = await request.json();
     const { title, description, options, expires_at, allow_multiple_votes, is_anonymous } = body;
 
     // Find the poll
     const polls = getPolls();
     const pollIndex = polls.findIndex(p => p.id === id);
     
     if (pollIndex === -1) {
       return NextResponse.json(
         { error: 'Poll not found' },
         { status: 404 }
       );
     }
 
     const poll = polls[pollIndex];
 
     // Check if user is the creator
     if (poll.created_by !== sessionData.user.id) {
       return NextResponse.json(
         { error: 'Unauthorized - You can only update your own polls' },
         { status: 403 }
       );
     }
 
     // Update poll fields
     if (title) polls[pollIndex].title = title;
     if (description !== undefined) polls[pollIndex].description = description;
     if (expires_at !== undefined) polls[pollIndex].expires_at = expires_at;
     if (typeof allow_multiple_votes === 'boolean') polls[pollIndex].allow_multiple_votes = allow_multiple_votes;
     if (typeof is_anonymous === 'boolean') polls[pollIndex].is_anonymous = is_anonymous;
     
     if (options && Array.isArray(options)) {
       // Preserve existing vote counts when updating options
       const existingOptions = polls[pollIndex].options || [];
       polls[pollIndex].options = options.map((option, index) => {
         const existingOption = existingOptions.find(opt => opt.id === option.id);
         return {
           id: option.id || `${id}-option-${index}`,
           text: option.option_text,
           votes: existingOption ? existingOption.votes : 0
         };
       });
       polls[pollIndex].option_count = options.length;
     }
 
     polls[pollIndex].updated_at = new Date().toISOString();

    return NextResponse.json(
      { 
        message: 'Poll updated successfully',
        data: polls[pollIndex]
      },
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

/**
 * GET /api/polls/[id] - Fetch a specific poll by ID with options and results
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Debug: Log available polls and requested ID
    console.log('Available polls:', getPolls().map(p => ({ id: p.id, title: p.title })));
    console.log('Requested poll ID:', id);

    // Find the poll in our shared data store
    const poll = findPoll(id);

    if (!poll || !poll.is_active) {
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
        vote_count: option.votes // votes is already a number in our mock data
      })),
      total_votes: poll.options.reduce((sum: number, option: any) => sum + option.votes, 0),
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
 * PATCH /api/polls/[id] - Update poll status (activate/deactivate)
 */
export async function PATCH(
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
    const body = await request.json();
    const { is_active } = body;

    // Find the poll
    const polls = getPolls();
    const pollIndex = polls.findIndex(p => p.id === id);
    
    if (pollIndex === -1) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    const poll = polls[pollIndex];

    // Check if user is the creator
    if (poll.created_by !== sessionData.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only update your own polls' },
        { status: 403 }
      );
    }

    // Update the poll status
    if (typeof is_active === 'boolean') {
      polls[pollIndex].is_active = is_active;
    }

    return NextResponse.json(
      { 
        message: 'Poll updated successfully',
        data: polls[pollIndex]
      },
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
    const polls = getPolls();
    const pollIndex = polls.findIndex(p => p.id === id);
    
    if (pollIndex === -1) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    const poll = polls[pollIndex];

    // Check if user is the creator
    if (poll.created_by !== sessionData.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only delete your own polls' },
        { status: 403 }
      );
    }

    // Delete the poll from mock data
    polls.splice(pollIndex, 1);

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