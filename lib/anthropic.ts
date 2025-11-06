import Anthropic from '@anthropic-ai/sdk';

let _anthropic: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
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

// For backwards compatibility
export const anthropic = {
  get messages() {
    return getAnthropicClient().messages;
  }
};

export const MODEL = 'claude-sonnet-4-20250514';
export const MAX_TOKENS = 4000;
