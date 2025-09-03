import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/polls - Fetch all polls or user-specific polls
 */
export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let query = supabase
      .from('polls')
      .select(`
        *,
        options:poll_options(*),
        votes:votes(count)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Filter by user if userId is provided
    if (userId) {
      query = query.eq('created_by', userId);
    }

    const { data: polls, error } = await query;

    if (error) {
      console.error('Error fetching polls:', error);
      return NextResponse.json(
        { error: 'Failed to fetch polls' },
        { status: 500 }
      );
    }

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

    const body = await request.json();
    const { title, description, options, expiresAt, allowMultipleVotes, isAnonymous } = body;

    // Validate required fields
    if (!title || !options || options.length < 2) {
      return NextResponse.json(
        { error: 'Title and at least 2 options are required' },
        { status: 400 }
      );
    }

    // Create the poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        title,
        description,
        created_by: user.id,
        expires_at: expiresAt || null,
        allow_multiple_votes: allowMultipleVotes || false,
        is_anonymous: isAnonymous || false,
        is_active: true,
      })
      .select()
      .single();

    if (pollError) {
      console.error('Error creating poll:', pollError);
      return NextResponse.json(
        { error: 'Failed to create poll' },
        { status: 500 }
      );
    }

    // Create poll options
    const pollOptions = options.map((option: string, index: number) => ({
      poll_id: poll.id,
      option_text: option,
      option_order: index + 1,
    }));

    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(pollOptions);

    if (optionsError) {
      console.error('Error creating poll options:', optionsError);
      // Clean up the poll if options creation failed
      await supabase.from('polls').delete().eq('id', poll.id);
      return NextResponse.json(
        { error: 'Failed to create poll options' },
        { status: 500 }
      );
    }

    // Fetch the complete poll with options
    const { data: completePoll } = await supabase
      .from('polls')
      .select(`
        *,
        options:poll_options(*)
      `)
      .eq('id', poll.id)
      .single();

    return NextResponse.json(
      { data: completePoll, message: 'Poll created successfully' },
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