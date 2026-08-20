import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import * as storageModule from '@/lib/storage';

vi.mock('@/lib/storage', () => ({
  saveSettings: vi.fn(),
}));

describe('GET /api/auth/tiktok/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when OAuth code parameter is missing', async () => {
    const req = new Request('http://localhost:3000/api/auth/tiktok/callback');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('exchanges valid code for token and redirects to blog', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      json: async () => ({
        access_token: 'valid_access_token',
        refresh_token: 'valid_refresh_token',
        expires_in: 86400,
        refresh_expires_in: 86400 * 30,
        open_id: 'tiktok_open_id',
        scope: 'user.info.basic',
      }),
    } as unknown as Response);

    const req = new Request('http://localhost:3000/api/auth/tiktok/callback?code=mock_code_123');
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(storageModule.saveSettings).toHaveBeenCalled();
  });
});
