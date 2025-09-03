import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/polls/[id] - Fetch a specific poll by ID with options and results
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch (error) {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    const { id } = params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid poll ID format' },
        { status: 400 }
      );
    }

    // Use the get_poll_with_results function for comprehensive poll data
    const { data: pollData, error: functionError } = await supabase
      .rpc('get_poll_with_results', { poll_uuid: id });

    if (functionError) {
      console.error('Error calling get_poll_with_results:', functionError);
      
      // Fallback to direct query if function fails
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('polls')
        .select(`
          *,
          poll_options (
            id,
            option_text,
            option_order
          )
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (fallbackError) {
        if (fallbackError.code === 'PGRST116') {
          return NextResponse.json(
            { error: 'Poll not found' },
            { status: 404 }
          );
        }
        console.error('Error fetching poll (fallback):', fallbackError);
        return NextResponse.json(
          { error: 'Failed to fetch poll' },
          { status: 500 }
        );
      }

      return NextResponse.json({ data: fallbackData });
    }

    // Check if poll was found
    if (!pollData || pollData.length === 0) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    const poll = pollData[0];
    
    // Transform the data to match expected format
    const transformedPoll = {
      ...poll,
      options: poll.options || [],
      is_expired: poll.is_expired || false,
      total_votes: poll.total_votes || 0,
      user_vote: poll.user_vote || null
    };

    return NextResponse.json({ data: transformedPoll });
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
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch (error) {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    const { id } = params;

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

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid poll ID format' },
        { status: 400 }
      );
    }

    // Check if poll exists and user is the creator
    const { data: poll, error: fetchError } = await supabase
      .from('polls')
      .select('id, created_by')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Poll not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching poll for deletion:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch poll' },
        { status: 500 }
      );
    }

    // Check if user is the creator
    if (poll.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only delete your own polls' },
        { status: 403 }
      );
    }

    // Delete the poll (cascade will handle options and votes)
    const { error: deleteError } = await supabase
      .from('polls')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting poll:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete poll' },
        { status: 500 }
      );
    }

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