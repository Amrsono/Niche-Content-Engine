import { describe, it, expect } from 'vitest';
import { GET } from './route';

describe('GET /api/auth/tiktok/connect', () => {
  it('redirects to TikTok OAuth authorization URL', async () => {
    process.env.TIKTOK_CLIENT_KEY = 'test_key';
    const res = await GET();
    expect(res.status).toBe(307); // NextResponse.redirect status
  });
});
