import { vi } from 'vitest';

export const GEMINI_MODELS = {
  FLASH: 'gemini-2.5-flash',
  PRO: 'gemini-3.1-pro-preview',
} as const;

export const callGeminiProvider = vi.fn(async (prompt: string): Promise<string> => {
  if (prompt.includes('trends')) {
    return JSON.stringify({
      trends: [
        { keyword: 'gemini fallback topic', searchVolume: 10000, competition: 'LOW' },
      ],
    });
  }
  return '<h2>Gemini Fallback Section</h2><p>Deterministic Gemini response for testing.</p>';
});
