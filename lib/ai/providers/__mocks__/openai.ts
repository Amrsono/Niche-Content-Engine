import { vi } from 'vitest';
import type OpenAI from 'openai';

export const OPENAI_MODELS = {
  MINI: 'gpt-4o-mini',
  MAIN: 'gpt-4o',
} as const;

export const callOpenAIProvider = vi.fn(
  async (): Promise<OpenAI.Chat.ChatCompletion> => {
    return {
      id: 'mock-openai-id',
      object: 'chat.completion',
      created: Date.now(),
      model: 'gpt-4o-mini',
      choices: [
        {
          index: 0,
          finish_reason: 'stop',
          logprobs: null,
          message: {
            role: 'assistant',
            content: '<h2>OpenAI Fallback Section</h2><p>Deterministic OpenAI response for testing.</p>',
            refusal: null,
          },
        },
      ],
    };
  }
);
