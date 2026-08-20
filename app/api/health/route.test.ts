import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/errorTracking', () => ({
  errorTracker: { isConfigured: false },
}));

vi.mock('@/lib/env', () => ({
  getAvailableAIProviders: () => ({ groq: false, gemini: false, openai: false }),
}));

import { GET } from './route';

describe('GET /api/health', () => {
  it('returns status ok with expected shape', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.hasHealthEndpoint).toBe(true);
    expect(data.version).toBe('1.1.0');
    expect(data.features).toBeDefined();
    expect(data.features.ai).toBeDefined();
    expect(data.features.storage).toBeDefined();
    expect(data.features.errorTracking).toBeDefined();
    expect(typeof data.uptimeSeconds).toBe('number');
    expect(typeof data.timestamp).toBe('string');
  });

  it('features.errorTracking.sentryConfigured reflects tracker state', async () => {
    const response = await GET();
    const data = await response.json();
    expect(data.features.errorTracking.sentryConfigured).toBe(false);
  });
});
