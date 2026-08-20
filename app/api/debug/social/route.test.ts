import { describe, it, expect } from 'vitest';
import { GET } from './route';

describe('GET /api/debug/social', () => {
  it('returns diagnostics report on configured social tokens', async () => {
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.TWITTER_API_KEY).toBeDefined();
    expect(data.INSTAGRAM_ACCESS_TOKEN).toBeDefined();
  });
});
