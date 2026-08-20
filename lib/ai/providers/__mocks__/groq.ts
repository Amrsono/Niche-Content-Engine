import { vi } from 'vitest';
import type { GroqChatParams, GroqChatResponse } from '../groq';

export const GROQ_MODELS = {
  DISCOVERY: 'llama-3.3-70b-versatile',
  REASONING: 'llama-3.3-70b-versatile',
  FAST: 'llama-3.1-8b-instant',
} as const;

export const callGroqProvider = vi.fn(async (params: GroqChatParams): Promise<GroqChatResponse> => {
  const content = (params.messages || []).map((m) => String(m.content || '')).join(' ');
  
  if (content.includes('trends')) {
    return {
      id: 'mock-groq-1',
      choices: [
        {
          index: 0,
          finish_reason: 'stop',
          logprobs: null,
          message: {
            role: 'assistant',
            content: JSON.stringify({
              trends: [
                { keyword: 'ai automation tools', searchVolume: 12000, competition: 'LOW' },
                { keyword: 'nextjs 16 tutorial', searchVolume: 8500, competition: 'LOW' },
              ],
            }),
          },
        },
      ],
      created: Date.now(),
      model: 'llama-3.3-70b-versatile',
      object: 'chat.completion',
    } as unknown as GroqChatResponse;
  }

  if (content.includes('outline')) {
    return {
      id: 'mock-groq-2',
      choices: [
        {
          index: 0,
          finish_reason: 'stop',
          logprobs: null,
          message: {
            role: 'assistant',
            content: JSON.stringify({
              sections: [
                { title: 'The Rise of Intelligent Systems', targetWordCount: 500 },
                { title: 'Future Implementations and Analysis', targetWordCount: 500 },
              ],
            }),
          },
        },
      ],
      created: Date.now(),
      model: 'llama-3.3-70b-versatile',
      object: 'chat.completion',
    } as unknown as GroqChatResponse;
  }

  if (content.includes('headline')) {
    return {
      id: 'mock-groq-3',
      choices: [
        {
          index: 0,
          finish_reason: 'stop',
          logprobs: null,
          message: {
            role: 'assistant',
            content: JSON.stringify({
              title: 'Next-Gen AI Automation in 2026',
              metaDescription: 'A comprehensive guide to next-generation AI automation strategies.',
            }),
          },
        },
      ],
      created: Date.now(),
      model: 'llama-3.3-70b-versatile',
      object: 'chat.completion',
    } as unknown as GroqChatResponse;
  }

  if (content.includes('hashtag')) {
    return {
      id: 'mock-groq-4',
      choices: [
        {
          index: 0,
          finish_reason: 'stop',
          logprobs: null,
          message: {
            role: 'assistant',
            content: '#ai #automation #futuretech #innovation',
          },
        },
      ],
      created: Date.now(),
      model: 'llama-3.1-8b-instant',
      object: 'chat.completion',
    } as unknown as GroqChatResponse;
  }

  return {
    id: 'mock-groq-5',
    choices: [
      {
        index: 0,
        finish_reason: 'stop',
        logprobs: null,
        message: {
          role: 'assistant',
          content: '<h2>Insightful Article Section</h2><p>High quality content generated deterministically for testing.</p>',
        },
      },
    ],
    created: Date.now(),
    model: 'llama-3.3-70b-versatile',
    object: 'chat.completion',
  } as unknown as GroqChatResponse;
});
