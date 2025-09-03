import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/polls/[id]/vote - Cast a vote on a specific poll
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { id: pollId } = params;
    const body = await request.json();
    const { optionId } = body;

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
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

    // Validate UUID formats
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(pollId) || !uuidRegex.test(optionId)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    // Get client IP and user agent for anonymous tracking
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    // Use the cast_vote function for safe voting
    const { data: voteResult, error: voteError } = await supabase
      .rpc('cast_vote', {
        poll_uuid: pollId,
        option_uuid: optionId,
        voter_ip_addr: clientIP,
        voter_user_agent: userAgent
      });

    if (voteError) {
      console.error('Error calling cast_vote function:', voteError);
      
      // Fallback to direct database operations if function fails
      try {
        // Check if poll exists and is active
        const { data: poll, error: pollError } = await supabase
          .from('polls')
          .select('id, is_active, expires_at, allow_multiple_votes')
          .eq('id', pollId)
          .single();

        if (pollError || !poll) {
          return NextResponse.json(
            { error: 'Poll not found' },
            { status: 404 }
          );
        }

        if (!poll.is_active) {
          return NextResponse.json(
            { error: 'Poll is not active' },
            { status: 400 }
          );
        }

        if (poll.expires_at && new Date(poll.expires_at) <= new Date()) {
          return NextResponse.json(
            { error: 'Poll has expired' },
            { status: 400 }
          );
        }

        // Check if option belongs to this poll
        const { data: option, error: optionError } = await supabase
          .from('poll_options')
          .select('id')
          .eq('id', optionId)
          .eq('poll_id', pollId)
          .single();

        if (optionError || !option) {
          return NextResponse.json(
            { error: 'Invalid option for this poll' },
            { status: 400 }
          );
        }

        // Check for existing vote
        const { data: existingVote, error: existingVoteError } = await supabase
          .from('votes')
          .select('id')
          .eq('poll_id', pollId)
          .eq('user_id', user.id)
          .single();

        if (existingVote && !poll.allow_multiple_votes) {
          // Update existing vote
          const { error: updateError } = await supabase
            .from('votes')
            .update({
              option_id: optionId,
              created_at: new Date().toISOString()
            })
            .eq('id', existingVote.id);

          if (updateError) {
            throw updateError;
          }

          return NextResponse.json({
            success: true,
            message: 'Vote updated successfully',
            vote_id: existingVote.id
          });
        } else {
          // Create new vote
          const { data: newVote, error: insertError } = await supabase
            .from('votes')
            .insert({
              poll_id: pollId,
              option_id: optionId,
              user_id: user.id,
              voter_ip: clientIP,
              user_agent: userAgent
            })
            .select('id')
            .single();

          if (insertError) {
            throw insertError;
          }

          return NextResponse.json({
            success: true,
            message: 'Vote cast successfully',
            vote_id: newVote.id
          });
        }
      } catch (fallbackError) {
        console.error('Fallback voting error:', fallbackError);
        return NextResponse.json(
          { error: 'Failed to cast vote' },
          { status: 500 }
        );
      }
    }

    // Handle function result
    if (voteResult && typeof voteResult === 'object') {
      if (voteResult.success === false) {
        return NextResponse.json(
          { error: voteResult.error || 'Failed to cast vote' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: voteResult.message || 'Vote cast successfully',
        vote_id: voteResult.vote_id
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Vote cast successfully'
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}