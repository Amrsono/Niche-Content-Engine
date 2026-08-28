import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import * as adminGuard from '@/lib/adminGuard.server';
import * as storage from '@/lib/storage';
import { NextResponse } from 'next/server';

vi.mock('@/lib/adminGuard.server', () => ({
  requireServerAdmin: vi.fn(),
}));

vi.mock('@/lib/storage', () => ({
  saveSettings: vi.fn(),
  getSettings: vi.fn(),
}));

describe('Gemini Settings API Routes (app/api/settings/gemini/route.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/settings/gemini', () => {
    it('returns 401 when unauthorized', async () => {
      vi.mocked(adminGuard.requireServerAdmin).mockResolvedValueOnce({
        authorized: false,
        errorResponse: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }),
      });

      const response = await GET();
      expect(response.status).toBe(401);
    });

    it('returns configured status and masked key for admin', async () => {
      vi.mocked(adminGuard.requireServerAdmin).mockResolvedValueOnce({
        authorized: true,
        userEmail: 'admin@example.com',
      });
      vi.mocked(storage.getSettings).mockResolvedValueOnce('AIzaSy1234567890TestKey');

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.configured).toBe(true);
      expect(body.maskedKey).toContain('AIza••••••••tKey');
    });
  });

  describe('POST /api/settings/gemini', () => {
    it('returns 400 when body payload is invalid', async () => {
      vi.mocked(adminGuard.requireServerAdmin).mockResolvedValueOnce({
        authorized: true,
        userEmail: 'admin@example.com',
      });

      const request = new Request('http://localhost/api/settings/gemini', {
        method: 'POST',
        body: JSON.stringify({ apiKey: 12345 }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('saves Gemini API key and returns masked key for valid admin request', async () => {
      vi.mocked(adminGuard.requireServerAdmin).mockResolvedValueOnce({
        authorized: true,
        userEmail: 'admin@example.com',
      });
      vi.mocked(storage.saveSettings).mockResolvedValueOnce(true);

      const request = new Request('http://localhost/api/settings/gemini', {
        method: 'POST',
        body: JSON.stringify({ apiKey: 'AIzaSy1234567890NewKey' }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.configured).toBe(true);
      expect(body.maskedKey).toBe('AIza••••••••wKey');
      expect(storage.saveSettings).toHaveBeenCalledWith('GEMINI_API_KEY', 'AIzaSy1234567890NewKey');
    });
  });
});
