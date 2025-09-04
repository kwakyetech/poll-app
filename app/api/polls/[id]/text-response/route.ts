import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Mock data store for text responses
interface MockTextResponse {
  id: string;
  poll_id: string;
  user_id: string;
  response_text: string;
  voter_ip: string;
  user_agent: string;
  created_at: string;
}

let mockTextResponses: MockTextResponse[] = [];

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('mock-session');
    
    // Mock authentication check
    if (!sessionCookie || sessionCookie.value !== 'authenticated') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const mockUserId = 'mock-user-123';

    const { responseText } = await request.json();
    const pollId = params.id;

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

    // Mock poll validation - only allow text polls (poll ID 3 in our mock data)
    if (pollId !== '3') {
      return NextResponse.json(
        { error: 'Poll not found or does not accept text responses' },
        { status: 404 }
      );
    }

    // Check if user has already responded (mock: no multiple responses)
    const existingResponse = mockTextResponses.find(
      response => response.poll_id === pollId && response.user_id === mockUserId
    );

    if (existingResponse) {
      return NextResponse.json(
        { error: 'You have already responded to this poll' },
        { status: 400 }
      );
    }

    // Get client IP and user agent for tracking
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    // Create new text response
    const responseId = `text-response-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newResponse: MockTextResponse = {
      id: responseId,
      poll_id: pollId,
      user_id: mockUserId,
      response_text: responseText.trim(),
      voter_ip: clientIP,
      user_agent: userAgent,
      created_at: new Date().toISOString()
    };

    mockTextResponses.push(newResponse);

    return NextResponse.json({
      success: true,
      message: 'Response submitted successfully',
      response: {
        id: newResponse.id,
        response_text: newResponse.response_text,
        created_at: newResponse.created_at
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
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('mock-session');
    const pollId = params.id;

    // Mock poll validation - only allow text polls (poll ID 3 in our mock data)
    if (pollId !== '3') {
      return NextResponse.json(
        { error: 'Poll not found or does not have text responses' },
        { status: 404 }
      );
    }

    // Get responses for this poll
    const responses = mockTextResponses
      .filter(response => response.poll_id === pollId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map(({ user_id, voter_ip, user_agent, ...rest }) => rest); // Remove sensitive data

    return NextResponse.json({
      responses: responses,
      total: responses.length
    });

  } catch (error) {
    console.error('Error in text responses GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}