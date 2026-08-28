import { vi } from 'vitest';
import type { GroqChatResponse } from '../groq';

export const GROQ_MODELS = {
  DISCOVERY: 'llama-3.1-8b-instant',
  REASONING: 'llama-3.1-8b-instant',
  FAST: 'llama-3.1-8b-instant',
} as const;

export const callGroqProvider = vi.fn(async (params: any): Promise<GroqChatResponse> => {
  const content = (params.messages || []).map((m: any) => m.content).join(' ');

  if (content.includes('JSON with \'trends\'') || content.includes('Pick the top 3')) {
    return {
      id: 'mock-groq-id',
      object: 'chat.completion',
      created: Date.now(),
      model: 'llama-3.1-8b-instant',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: JSON.stringify({
              trends: [
                { keyword: 'Groq AI trend 1', searchVolume: 12000, competition: 'LOW' },
                { keyword: 'Groq AI trend 2', searchVolume: 9500, competition: 'LOW' },
                { keyword: 'Groq AI trend 3', searchVolume: 8000, competition: 'MEDIUM' },
              ],
            }),
          },
          finish_reason: 'stop',
        },
      ],
    } as GroqChatResponse;
  }

  if (content.includes('sections') || content.includes('Create an outline')) {
    return {
      id: 'mock-groq-id',
      object: 'chat.completion',
      created: Date.now(),
      model: 'llama-3.1-8b-instant',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: JSON.stringify({
              sections: [
                { title: 'Introduction to Topic', targetWordCount: 250 },
                { title: 'Key Concepts & Features', targetWordCount: 300 },
                { title: 'Practical Applications', targetWordCount: 250 },
                { title: 'Conclusion & Next Steps', targetWordCount: 200 },
              ],
            }),
          },
          finish_reason: 'stop',
        },
      ],
    } as GroqChatResponse;
  }

  if (content.includes('headline for an article') || content.includes('meta description')) {
    return {
      id: 'mock-groq-id',
      object: 'chat.completion',
      created: Date.now(),
      model: 'llama-3.1-8b-instant',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: JSON.stringify({
              title: 'Groq Generated Unique Title',
              metaDescription: 'Groq generated unique meta description for testing.',
            }),
          },
          finish_reason: 'stop',
        },
      ],
    } as GroqChatResponse;
  }

  return {
    id: 'mock-groq-id',
    object: 'chat.completion',
    created: Date.now(),
    model: 'llama-3.1-8b-instant',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: '<h2>Groq Section Title</h2><p>Deterministic Groq response content for unit tests.</p>',
        },
        finish_reason: 'stop',
      },
    ],
  } as GroqChatResponse;
});
