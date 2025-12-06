import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPolls, addPoll } from '@/lib/mockData';
import { validateSession, checkRateLimit, sanitizeInput } from '@/lib/auth';

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

// Input validation schema
const createPollSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  pollType: z.enum(['single', 'multiple', 'text'], { required_error: 'Invalid poll type' }),
  options: z.array(z.string().min(1).max(100)).min(2, 'At least 2 options required').max(10, 'Too many options').optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  allowMultipleVotes: z.boolean().optional(),
  isAnonymous: z.boolean().optional()
}).refine((data) => {
  if (data.pollType !== 'text' && (!data.options || data.options.length < 2)) {
    return false;
  }
  return true;
}, {
  message: 'Choice-based polls require at least 2 options',
  path: ['options']
});

/**
 * POST /api/polls - Create a new poll
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIP, 'create-poll', 5, 300)) { // 5 polls per 5 minutes
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Check for secure authentication session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('poll_session');
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = validateSession(sessionToken.value);
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input using Zod schema
    const validationResult = createPollSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { title, description, pollType, options, expiresAt, allowMultipleVotes, isAnonymous } = validationResult.data;
    
    // Sanitize text inputs
    const sanitizedTitle = sanitizeInput(title);
    const sanitizedDescription = description ? sanitizeInput(description) : '';
    const sanitizedOptions = options ? options.map(option => sanitizeInput(option)) : [];

    // Create new poll with sanitized data
    const newPoll = {
      id: `poll-${getPolls().length + 1}`,
      title: sanitizedTitle,
      description: sanitizedDescription,
      poll_type: pollType,
      created_by: userId,
      created_at: new Date().toISOString(),
      expires_at: expiresAt || null,
      allow_multiple_votes: allowMultipleVotes || false,
      is_anonymous: isAnonymous || false,
      is_active: true,
      options: []
    };

    // Create poll options (only for non-text polls)
    if (pollType !== 'text' && sanitizedOptions && sanitizedOptions.length > 0) {
      newPoll.options = sanitizedOptions.map((option: string, index: number) => ({
        id: `${newPoll.id}-option-${index + 1}`,
        poll_id: newPoll.id,
        text: option,
        option_order: index + 1,
        votes: 0
      }));
    }

    // Add to mock database
    addPoll(newPoll);

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