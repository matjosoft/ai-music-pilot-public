import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse } from '@/lib/ai-client';
import { SYSTEM_PROMPT, generateProjectPrompt, generateArtistModePrompt } from '@/lib/prompts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mode, vision, genre, mood, tempo, wordDensity, title, artistName, instrumental } = body;

    let userPrompt: string;

    // Handle artist mode
    if (mode === 'artist') {
      // Validate artist mode input
      if (!title || !artistName) {
        return NextResponse.json(
          { error: 'Missing required fields: title and artistName are required for artist mode' },
          { status: 400 }
        );
      }

      // Generate user prompt for artist mode
      userPrompt = generateArtistModePrompt(title, artistName, wordDensity || 'medium');
    } else {
      // Handle custom mode (existing logic)
      // Validate input
      if (!vision || !genre || !mood || !tempo) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Generate user prompt
      userPrompt = generateProjectPrompt(vision, genre, mood, tempo, wordDensity || 'medium', instrumental || false);
    }

    // Call AI API (supports both Anthropic and OpenAI)
    const response = await generateAIResponse({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
    });

    // Parse JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response.content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', response.content);
      return NextResponse.json(
        { error: 'Invalid response format from AI' },
        { status: 500 }
      );
    }

    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error('Error generating project:', error);
    return NextResponse.json(
      { error: 'Failed to generate project' },
      { status: 500 }
    );
  }
}
