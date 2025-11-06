import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export type AIProvider = 'anthropic' | 'openai';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
}

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

    const completion = await openai.chat.completions.create(completionParams);

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
