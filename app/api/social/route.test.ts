import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import * as clerkServer from '@clerk/nextjs/server';
import * as agentsModule from '@/lib/agents';
import * as storageModule from '@/lib/storage';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/storage', () => ({
  getPostBySlug: vi.fn(),
  updatePost: vi.fn(),
}));

vi.mock('@/lib/agents', () => ({
  publishToTwitter: vi.fn(),
  publishToInstagram: vi.fn(),
  publishToTikTok: vi.fn(),
  publishToFacebook: vi.fn(),
}));

describe('POST /api/social', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthorized', async () => {
    vi.mocked(clerkServer.auth).mockResolvedValueOnce({ userId: null } as unknown as ReturnType<typeof clerkServer.auth> extends Promise<infer R> ? R : never);

    const req = new Request('http://localhost:3000/api/social', {
      method: 'POST',
      body: JSON.stringify({ platform: 'twitter', slug: 'my-post' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 404 when post is not found', async () => {
    vi.mocked(clerkServer.auth).mockResolvedValueOnce({ userId: 'u_1' } as unknown as ReturnType<typeof clerkServer.auth> extends Promise<infer R> ? R : never);
    vi.mocked(storageModule.getPostBySlug).mockResolvedValueOnce(undefined);

    const req = new Request('http://localhost:3000/api/social', {
      method: 'POST',
      body: JSON.stringify({ platform: 'twitter', slug: 'non-existent' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('publishes to Twitter and updates post storage', async () => {
    vi.mocked(clerkServer.auth).mockResolvedValueOnce({ userId: 'u_1' } as unknown as ReturnType<typeof clerkServer.auth> extends Promise<infer R> ? R : never);
    vi.mocked(storageModule.getPostBySlug).mockResolvedValueOnce({
      id: 'p-1',
      slug: 'ai-post',
      title: 'AI Post',
      content: 'Content',
      metaDescription: 'Desc',
      publishedAt: new Date().toISOString(),
      status: 'published',
      keyword: 'ai',
    });

    vi.mocked(agentsModule.publishToTwitter).mockResolvedValueOnce({
      status: 'success',
      url: 'https://x.com/status/12345',
      platform: 'X/Twitter',
    });

    const req = new Request('http://localhost:3000/api/social', {
      method: 'POST',
      body: JSON.stringify({ platform: 'twitter', slug: 'ai-post' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.url).toBe('https://x.com/status/12345');
    expect(storageModule.updatePost).toHaveBeenCalledWith('p-1', { twitterUrl: 'https://x.com/status/12345' });
  });
});
