import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse } from '@/lib/ai-client';
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
    console.error('Error regenerating metatags:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate metatags' },
      { status: 500 }
    );
  }
}
