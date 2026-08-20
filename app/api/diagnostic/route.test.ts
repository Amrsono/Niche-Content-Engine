import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';

describe('POST /api/diagnostic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GEMINI_API_KEY;
  });

  it('returns 400 when GEMINI_API_KEY is missing', async () => {
    const req = new Request('http://localhost:3000/api/diagnostic', {
      method: 'POST',
      body: JSON.stringify({ model: 'gemini-2.0-flash' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('validates request payload and rejects empty model', async () => {
    const req = new Request('http://localhost:3000/api/diagnostic', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
