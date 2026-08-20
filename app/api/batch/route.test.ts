import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import * as clerkServer from '@clerk/nextjs/server';
import * as agentsModule from '@/lib/agents';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

vi.mock('@/lib/agents', () => ({
  runTrendScraper: vi.fn(),
  generateArticle: vi.fn(),
  generateOgImage: vi.fn(),
  publishToLocal: vi.fn(),
  updatePost: vi.fn(),
}));

vi.mock('@/lib/indexing', () => ({
  requestIndexing: vi.fn().mockResolvedValue({ success: true }),
}));

describe('POST /api/batch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_ADMIN_EMAILS = 'admin@example.com';
  });

  it('returns 401 Unauthorized when userId is absent', async () => {
    vi.mocked(clerkServer.auth).mockResolvedValueOnce({ userId: null } as unknown as ReturnType<typeof clerkServer.auth> extends Promise<infer R> ? R : never);

    const req = new Request('http://localhost:3000/api/batch', {
      method: 'POST',
      body: JSON.stringify({ niche: 'AI Coding', count: 2 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 403 Forbidden when user is not an admin', async () => {
    vi.mocked(clerkServer.auth).mockResolvedValueOnce({ userId: 'user_123' } as unknown as ReturnType<typeof clerkServer.auth> extends Promise<infer R> ? R : never);
    vi.mocked(clerkServer.currentUser).mockResolvedValueOnce({
      emailAddresses: [{ emailAddress: 'regular@user.com' }],
    } as unknown as ReturnType<typeof clerkServer.currentUser> extends Promise<infer R> ? R : never);

    const req = new Request('http://localhost:3000/api/batch', {
      method: 'POST',
      body: JSON.stringify({ niche: 'AI Coding', count: 2 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('returns 400 Bad Request when request body is invalid', async () => {
    vi.mocked(clerkServer.auth).mockResolvedValueOnce({ userId: 'user_admin' } as unknown as ReturnType<typeof clerkServer.auth> extends Promise<infer R> ? R : never);
    vi.mocked(clerkServer.currentUser).mockResolvedValueOnce({
      emailAddresses: [{ emailAddress: 'admin@example.com' }],
    } as unknown as ReturnType<typeof clerkServer.currentUser> extends Promise<infer R> ? R : never);

    const req = new Request('http://localhost:3000/api/batch', {
      method: 'POST',
      body: JSON.stringify({ count: -5 }), // missing niche and invalid count
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('processes batch cycle for authorized admin with valid payload', async () => {
    vi.mocked(clerkServer.auth).mockResolvedValueOnce({ userId: 'user_admin' } as unknown as ReturnType<typeof clerkServer.auth> extends Promise<infer R> ? R : never);
    vi.mocked(clerkServer.currentUser).mockResolvedValueOnce({
      emailAddresses: [{ emailAddress: 'admin@example.com' }],
    } as unknown as ReturnType<typeof clerkServer.currentUser> extends Promise<infer R> ? R : never);

    vi.mocked(agentsModule.runTrendScraper).mockResolvedValueOnce([
      { keyword: 'AI Tool 1', searchVolume: 1000, competition: 'LOW', niche: 'Tech' },
    ]);
    vi.mocked(agentsModule.generateArticle).mockResolvedValueOnce({
      title: 'AI Tool 1 Guide',
      content: 'Content',
      metaDescription: 'Desc',
    });
    vi.mocked(agentsModule.generateOgImage).mockResolvedValueOnce('https://image.url');
    vi.mocked(agentsModule.publishToLocal).mockResolvedValueOnce({
      status: 'success',
      url: '/blog/ai-tool-1',
      platform: 'Local-Pulse-Blog',
      id: 'post-1',
    });

    const req = new Request('http://localhost:3000/api/batch', {
      method: 'POST',
      body: JSON.stringify({ niche: 'Tech', count: 1 }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.totalProcessed).toBe(1);
    expect(data.results[0].title).toBe('AI Tool 1 Guide');
  });
});
