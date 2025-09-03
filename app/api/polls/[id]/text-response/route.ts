import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { responseText } = await request.json();

    if (!responseText || typeof responseText !== 'string' || responseText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Response text is required' },
        { status: 400 }
      );
    }

    if (responseText.length > 1000) {
      return NextResponse.json(
        { error: 'Response text must be less than 1000 characters' },
        { status: 400 }
      );
    }

    const pollId = params.id;

    // Check if poll exists and is a text input poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('id, poll_type, is_active, expires_at, allow_multiple_votes')
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    if (poll.poll_type !== 'text') {
      return NextResponse.json(
        { error: 'This poll does not accept text responses' },
        { status: 400 }
      );
    }

    if (!poll.is_active) {
      return NextResponse.json(
        { error: 'This poll is no longer active' },
        { status: 400 }
      );
    }

    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This poll has expired' },
        { status: 400 }
      );
    }

    // Check if user has already responded (unless multiple responses allowed)
    if (!poll.allow_multiple_votes) {
      const { data: existingResponse } = await supabase
        .from('text_responses')
        .select('id')
        .eq('poll_id', pollId)
        .eq('user_id', user.id)
        .single();

      if (existingResponse) {
        return NextResponse.json(
          { error: 'You have already responded to this poll' },
          { status: 400 }
        );
      }
    }

    // Get client IP and user agent for tracking
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    // Insert the text response
    const { data: response, error: insertError } = await supabase
      .from('text_responses')
      .insert({
        poll_id: pollId,
        user_id: user.id,
        response_text: responseText.trim(),
        voter_ip: clientIP,
        user_agent: userAgent
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting text response:', insertError);
      
      // Handle unique constraint violation (user already responded)
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'You have already responded to this poll' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to submit response' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Response submitted successfully',
      response: {
        id: response.id,
        response_text: response.response_text,
        created_at: response.created_at
      }
    });

  } catch (error) {
    console.error('Error in text response API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve text responses for a poll
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    const pollId = params.id;

    // Get poll information
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('id, poll_type, is_anonymous, created_by')
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    if (poll.poll_type !== 'text') {
      return NextResponse.json(
        { error: 'This poll does not have text responses' },
        { status: 400 }
      );
    }

    // Build query based on permissions
    let query = supabase
      .from('text_responses')
      .select('id, response_text, created_at, user_id')
      .eq('poll_id', pollId)
      .order('created_at', { ascending: false });

    // If poll is anonymous, only show responses to poll creator
    if (poll.is_anonymous && (!user || user.id !== poll.created_by)) {
      return NextResponse.json(
        { error: 'This poll\'s responses are anonymous' },
        { status: 403 }
      );
    }

    const { data: responses, error: responsesError } = await query;

    if (responsesError) {
      console.error('Error fetching text responses:', responsesError);
      return NextResponse.json(
        { error: 'Failed to fetch responses' },
        { status: 500 }
      );
    }

    // If poll is anonymous, remove user_id from responses
    const sanitizedResponses = poll.is_anonymous 
      ? responses?.map(({ user_id, ...rest }) => rest)
      : responses;

    return NextResponse.json({
      responses: sanitizedResponses || [],
      total: responses?.length || 0
    });

  } catch (error) {
    console.error('Error in text responses GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}