import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import * as adminGuard from '@/lib/adminGuard.server';
import { NextResponse } from 'next/server';

vi.mock('@/lib/adminGuard.server', () => ({
  requireServerAdmin: vi.fn(),
}));

vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: class {
      apiKey: string;
      constructor(apiKey: string) {
        this.apiKey = apiKey;
      }
      getGenerativeModel() {
        if (this.apiKey === 'invalid-key') {
          return {
            generateContent: async () => {
              throw new Error('Invalid API Key');
            },
          };
        }
        return {
          generateContent: async () => ({
            response: { text: () => 'Ready' },
          }),
        };
      }
    },
  };
});

describe('Gemini Test Connection API Route (app/api/settings/gemini/test/route.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when non-admin accesses endpoint', async () => {
    vi.mocked(adminGuard.requireServerAdmin).mockResolvedValueOnce({
      authorized: false,
      errorResponse: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }),
    });

    const req = new Request('http://localhost/api/settings/gemini/test', { method: 'POST' });
    const response = await POST(req);
    expect(response.status).toBe(401);
  });

  it('returns 400 when no key is provided or configured', async () => {
    vi.mocked(adminGuard.requireServerAdmin).mockResolvedValueOnce({
      authorized: true,
      userEmail: 'admin@example.com',
    });
    delete process.env.GEMINI_API_KEY;

    const req = new Request('http://localhost/api/settings/gemini/test', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain('No Gemini API key');
  });

  it('returns success response when valid key is tested', async () => {
    vi.mocked(adminGuard.requireServerAdmin).mockResolvedValueOnce({
      authorized: true,
      userEmail: 'admin@example.com',
    });

    const req = new Request('http://localhost/api/settings/gemini/test', {
      method: 'POST',
      body: JSON.stringify({ apiKey: 'valid-test-key' }),
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain('Successfully connected to Gemini');
  });

  it('returns 400 with error message when invalid key is tested', async () => {
    vi.mocked(adminGuard.requireServerAdmin).mockResolvedValueOnce({
      authorized: true,
      userEmail: 'admin@example.com',
    });

    const req = new Request('http://localhost/api/settings/gemini/test', {
      method: 'POST',
      body: JSON.stringify({ apiKey: 'invalid-key' }),
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Invalid API Key');
  });
});
