import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { z } from 'zod';

export type AIProvider = 'anthropic' | 'openai';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
}

// Zod schemas for AI response validation
export const SongSchema = z.object({
  title: z.string().min(1).max(200),
  lyrics: z.string().min(1).max(10000),
  style: z.string().min(1).max(500),
});

export const SongResponseSchema = z.object({
  songs: z.array(SongSchema).min(1).max(1),
});

export const LyricsResponseSchema = z.object({
  lyrics: z.string().min(1).max(10000),
});

export const MetatagsResponseSchema = z.object({
  style: z.string().min(1).max(500),
  title: z.string().min(1).max(200),
});

export const StyleResponseSchema = z.object({
  style: z.string().min(1).max(500),
  reasoning: z.string().optional(),
});

export type SongResponse = z.infer<typeof SongResponseSchema>;
export type LyricsResponse = z.infer<typeof LyricsResponseSchema>;
export type MetatagsResponse = z.infer<typeof MetatagsResponseSchema>;
export type StyleResponse = z.infer<typeof StyleResponseSchema>;

let _anthropic: Anthropic | null = null;
let _openai: OpenAI | null = null;

function getAnthropicClient(): Anthropic {
  if (!_anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    _anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return _anthropic;
}

function getOpenAIClient(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORG,
      project: process.env.OPENAI_PROJECT,
    });
  }
  return _openai;
}

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER?.toLowerCase() as AIProvider;
  if (provider !== 'anthropic' && provider !== 'openai') {
    console.warn(`Invalid AI_PROVIDER: ${provider}. Defaulting to 'anthropic'`);
    return 'anthropic';
  }
  return provider;
}

export interface GenerateOptions {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}

export async function generateAIResponse(options: GenerateOptions): Promise<AIResponse> {
  const provider = getAIProvider();
  const maxTokens = options.maxTokens || 4000;

  if (provider === 'openai') {
    const openai = getOpenAIClient();
    const model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';

    // GPT-5 and newer models use max_completion_tokens instead of max_tokens
    const useMaxCompletionTokens = model.startsWith('gpt-5') ||
                                    model.startsWith('o1') ||
                                    model.startsWith('o3');

    const completionParams: OpenAI.Chat.ChatCompletionCreateParams = {
      model,
      messages: [
        {
          role: 'system',
          content: options.systemPrompt,
        },
        {
          role: 'user',
          content: options.userPrompt,
        },
      ],
      response_format: { type: 'json_object' },
    };

    // Add the appropriate token limit parameter
    if (useMaxCompletionTokens) {
      completionParams.max_completion_tokens = maxTokens;
    } else {
      completionParams.max_tokens = maxTokens;
    }

    //const startTime = Date.now();
    const completion = await openai.chat.completions.create(completionParams);
    //const duration = (Date.now() - startTime) / 1000;
    //console.log(`OpenAI API call completed in ${duration.toFixed(2)} seconds`);

    const content = completion.choices[0]?.message?.content || '';
    return { content };
  } else {
    // Anthropic
    const anthropic = getAnthropicClient();
    const model = 'claude-sonnet-4-20250514';

    const message = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      system: options.systemPrompt,
      messages: [
        {
          role: 'user',
          content: options.userPrompt,
        },
      ],
    });

    const content = message.content[0].type === 'text'
      ? message.content[0].text
      : '';
    return { content };
  }
}

// Legacy exports for backwards compatibility
export const anthropic = {
  get messages() {
    return getAnthropicClient().messages;
  }
};

export const MODEL = 'claude-sonnet-4-20250514';
export const MAX_TOKENS = 4000;
