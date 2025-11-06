import { NextRequest, NextResponse } from 'next/server';
import { anthropic, MODEL, MAX_TOKENS } from '@/lib/anthropic';
import { SYSTEM_PROMPT, regenerateMetatagsPrompt } from '@/lib/prompts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lyrics, style } = body;

    // Validate input
    if (!lyrics || !style) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate user prompt
    const userPrompt = regenerateMetatagsPrompt(lyrics, style);

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
    console.error('Error regenerating metatags:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate metatags' },
      { status: 500 }
    );
  }
}
