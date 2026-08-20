import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import * as storageModule from '@/lib/storage';
import * as agentsModule from '@/lib/agents';

vi.mock('@/lib/storage', () => ({
  getPosts: vi.fn(),
  updatePost: vi.fn(),
}));

vi.mock('@/lib/agents', () => ({
  generateOgImage: vi.fn(),
}));

describe('GET /api/fix-images', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('scans and repairs posts with broken or legacy image URLs', async () => {
    vi.mocked(storageModule.getPosts).mockResolvedValueOnce([
      {
        id: 'p-broken',
        title: 'Broken Post',
        slug: 'broken-post',
        content: 'Body',
        metaDescription: 'Desc',
        ogImageUrl: 'https://image.pollinations.ai/prompt/broken.jpg',
        publishedAt: new Date().toISOString(),
        status: 'published',
        keyword: 'broken',
      },
    ]);

    vi.mocked(agentsModule.generateOgImage).mockResolvedValueOnce('https://new.image.url/fixed.jpg');
    vi.mocked(storageModule.updatePost).mockResolvedValueOnce({} as unknown as ReturnType<typeof storageModule.updatePost> extends Promise<infer R> ? R : never);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.summary.brokenFound).toBe(1);
    expect(data.summary.fixed).toBe(1);
  });
});
