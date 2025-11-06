import { NextRequest, NextResponse } from 'next/server';
import { anthropic, MODEL, MAX_TOKENS } from '@/lib/anthropic';
import { SYSTEM_PROMPT, regenerateLyricsPrompt } from '@/lib/prompts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentLyrics, style, instructions } = body;

    // Validate input
    if (!currentLyrics || !style) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate user prompt
    const userPrompt = regenerateLyricsPrompt(currentLyrics, style, instructions);

    // Call Claude API
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    // Extract response text
    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    // Parse JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', responseText);
      return NextResponse.json(
        { error: 'Invalid response format from AI' },
        { status: 500 }
      );
    }

    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error('Error regenerating lyrics:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate lyrics' },
      { status: 500 }
    );
  }
}
