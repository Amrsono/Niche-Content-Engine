import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isTokenExpired, getTikTokToken } from './token';
import * as storageModule from '../storage';

vi.mock('../storage', () => ({
  getSettings: vi.fn(),
  saveSettings: vi.fn(),
}));

describe('TikTok Token Manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isTokenExpired', () => {
    it('returns true if expiration timestamp is in the past', () => {
      const pastTime = Date.now() - 10000;
      expect(isTokenExpired(pastTime)).toBe(true);
    });

    it('returns true if expiration is within the 5-minute buffer', () => {
      const nearFutureTime = Date.now() + 2 * 60 * 1000;
      expect(isTokenExpired(nearFutureTime)).toBe(true);
    });

    it('returns false if expiration is safely beyond the buffer', () => {
      const farFutureTime = Date.now() + 60 * 60 * 1000;
      expect(isTokenExpired(farFutureTime)).toBe(false);
    });
  });

  describe('getTikTokToken', () => {
    it('returns null when no auth settings are stored', async () => {
      vi.mocked(storageModule.getSettings).mockResolvedValueOnce(null);
      const token = await getTikTokToken();
      expect(token).toBeNull();
    });

    it('returns fresh access token without network request', async () => {
      vi.mocked(storageModule.getSettings).mockResolvedValueOnce({
        access_token: 'fresh-token-123',
        refresh_token: 'refresh-456',
        expires_at: Date.now() + 3600 * 1000,
      });

      const token = await getTikTokToken();
      expect(token).toBe('fresh-token-123');
    });

    it('refreshes token via API when expiring or expired', async () => {
      process.env.TIKTOK_CLIENT_KEY = 'client-key';
      process.env.TIKTOK_CLIENT_SECRET = 'client-secret';

      vi.mocked(storageModule.getSettings).mockResolvedValueOnce({
        access_token: 'expired-token',
        refresh_token: 'valid-refresh-token',
        expires_at: Date.now() - 10000,
      });

      global.fetch = vi.fn().mockResolvedValueOnce({
        json: async () => ({
          access_token: 'new-refreshed-token',
          refresh_token: 'new-refresh-token',
          expires_in: 86400,
        }),
      } as unknown as Response);

      const token = await getTikTokToken();
      expect(token).toBe('new-refreshed-token');
      expect(storageModule.saveSettings).toHaveBeenCalled();
    });
  });
});
