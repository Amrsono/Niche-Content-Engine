import { describe, it, expect, beforeEach } from 'vitest';
import { GROQ_MODELS, callGroqProvider } from './groq';
import { GEMINI_MODELS, callGeminiProvider } from './gemini';
import { OPENAI_MODELS, callOpenAIProvider } from './openai';

describe('AI Dedicated Providers', () => {
  beforeEach(() => {
    process.env.GROQ_API_KEY = 'mock-groq-key';
    process.env.GEMINI_API_KEY = 'mock-gemini-key';
    process.env.OPENAI_API_KEY = 'mock-openai-key';
  });

  it('exposes standard model constants for discovery and fast inference', () => {
    expect(GROQ_MODELS.DISCOVERY).toBe('llama-3.1-8b-instant');
    expect(GROQ_MODELS.FAST).toBe('llama-3.1-8b-instant');
    expect(GEMINI_MODELS.FLASH).toBe('gemini-2.5-flash');
    expect(OPENAI_MODELS.MINI).toBe('gpt-4o-mini');
  });

  it('handles missing API keys by rejecting or throwing descriptive error', async () => {
    delete process.env.GROQ_API_KEY;
    await expect(
      callGroqProvider({ messages: [{ role: 'user', content: 'test' }], model: GROQ_MODELS.FAST })
    ).rejects.toThrow();

    delete process.env.GEMINI_API_KEY;
    await expect(
      callGeminiProvider('test', GEMINI_MODELS.FLASH)
    ).rejects.toThrow();

    delete process.env.OPENAI_API_KEY;
    await expect(
      callOpenAIProvider({ messages: [{ role: 'user', content: 'test' }], model: OPENAI_MODELS.MINI })
    ).rejects.toThrow();
  });
});
