import { describe, it, expect, vi, beforeEach } from 'vitest';
import { callAIWithFallback, resetProviderCooldowns, setProviderCooldown, isProviderCoolingDown } from './dispatcher';
import * as groqModule from './providers/groq';
import * as geminiModule from './providers/gemini';
import * as openaiModule from './providers/openai';

vi.mock('./utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./utils')>();
  return {
    ...actual,
    delay: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('./providers/groq', () => {
  return {
    GROQ_MODELS: {
      DISCOVERY: 'llama-3.3-70b-versatile',
      REASONING: 'llama-3.3-70b-versatile',
      FAST: 'llama-3.1-8b-instant',
    },
    callGroqProvider: vi.fn(),
  };
});

vi.mock('./providers/gemini', () => {
  return {
    GEMINI_MODELS: {
      FLASH: 'gemini-2.0-flash',
      PRO: 'gemini-1.5-pro',
    },
    callGeminiProvider: vi.fn(),
  };
});

vi.mock('./providers/openai', () => {
  return {
    OPENAI_MODELS: {
      MINI: 'gpt-4o-mini',
      MAIN: 'gpt-4o',
    },
    callOpenAIProvider: vi.fn(),
  };
});

describe('AI Dispatcher (callAIWithFallback)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetProviderCooldowns();
    process.env.GROQ_API_KEY = 'mock-groq-key';
    process.env.GEMINI_API_KEY = 'mock-gemini-key';
    process.env.OPENAI_API_KEY = 'mock-openai-key';
  });

  it('routes to Groq primarily when available and healthy', async () => {
    vi.mocked(groqModule.callGroqProvider).mockResolvedValueOnce({
      choices: [{ message: { content: 'Response from Groq' } }],
    } as unknown as groqModule.GroqChatResponse);

    const result = await callAIWithFallback({
      messages: [{ role: 'user', content: 'Generate article content' }],
      model: groqModule.GROQ_MODELS.REASONING,
    });

    expect(result.text).toBe('Response from Groq');
    expect(groqModule.callGroqProvider).toHaveBeenCalledTimes(1);
    expect(geminiModule.callGeminiProvider).not.toHaveBeenCalled();
  });

  it('falls back to Gemini when Groq returns 429 rate limit', async () => {
    vi.mocked(groqModule.callGroqProvider).mockRejectedValue({ status: 429 });
    vi.mocked(geminiModule.callGeminiProvider).mockResolvedValueOnce('Response from Gemini Fallback');

    const result = await callAIWithFallback({
      messages: [{ role: 'user', content: 'Generate article content' }],
      model: groqModule.GROQ_MODELS.REASONING,
    });

    expect(result.text).toBe('Response from Gemini Fallback');
    expect(geminiModule.callGeminiProvider).toHaveBeenCalled();
    expect(isProviderCoolingDown('groq')).toBe(true);
  });

  it('falls back to OpenAI when both Groq and Gemini fail', async () => {
    vi.mocked(groqModule.callGroqProvider).mockRejectedValue({ status: 429 });
    vi.mocked(geminiModule.callGeminiProvider).mockRejectedValue(new Error('Gemini API Unavailable'));
    vi.mocked(openaiModule.callOpenAIProvider).mockResolvedValueOnce({
      choices: [{ message: { content: 'Response from OpenAI Tertiary' } }],
    } as unknown as ReturnType<typeof openaiModule.callOpenAIProvider> extends Promise<infer R> ? R : never);

    const result = await callAIWithFallback({
      messages: [{ role: 'user', content: 'Generate content' }],
      model: groqModule.GROQ_MODELS.REASONING,
    });

    expect(result.text).toBe('Response from OpenAI Tertiary');
    expect(isProviderCoolingDown('groq')).toBe(true);
    expect(isProviderCoolingDown('gemini')).toBe(true);
  });

  it('switches to FAST model automatically for simple tasks like hashtags', async () => {
    vi.mocked(groqModule.callGroqProvider).mockResolvedValueOnce({
      choices: [{ message: { content: '#tech #ai' } }],
    } as unknown as groqModule.GroqChatResponse);

    await callAIWithFallback({
      messages: [{ role: 'user', content: 'Generate hashtags for post' }],
      model: groqModule.GROQ_MODELS.DISCOVERY,
    });

    expect(groqModule.callGroqProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        model: groqModule.GROQ_MODELS.FAST,
      })
    );
  });

  it('allows manual cooldown management via setProviderCooldown and resetProviderCooldowns', () => {
    expect(isProviderCoolingDown('groq')).toBe(false);
    setProviderCooldown('groq', 5000);
    expect(isProviderCoolingDown('groq')).toBe(true);
    resetProviderCooldowns();
    expect(isProviderCoolingDown('groq')).toBe(false);
  });
});
