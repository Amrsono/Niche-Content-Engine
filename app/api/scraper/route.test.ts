import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import * as agentsModule from '@/lib/agents';

vi.mock('@/lib/agents', () => ({
  runTrendScraper: vi.fn(),
  generateArticle: vi.fn(),
  generateOgImage: vi.fn(),
  publishToWordpress: vi.fn(),
  publishToSanity: vi.fn(),
  publishToLocal: vi.fn(),
  calculatePeakTime: vi.fn().mockReturnValue('2026-08-20T19:00:00.000Z'),
  updatePost: vi.fn(),
}));

describe('POST /api/scraper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('runs autonomous single cycle and returns complete draft metadata', async () => {
    vi.mocked(agentsModule.runTrendScraper).mockResolvedValueOnce([
      { keyword: 'nextjs 16 tutorial', searchVolume: 15000, competition: 'LOW', niche: 'Coding' },
    ]);
    vi.mocked(agentsModule.generateArticle).mockResolvedValueOnce({
      title: 'Mastering Next.js 16',
      content: '<p>Content</p>',
      metaDescription: 'Meta desc',
    });
    vi.mocked(agentsModule.generateOgImage).mockResolvedValueOnce('https://image.url/nextjs.jpg');
    vi.mocked(agentsModule.publishToLocal).mockResolvedValueOnce({
      status: 'success',
      url: '/blog/mastering-nextjs-16',
      platform: 'Local-Pulse-Blog',
      id: 'p-1',
    });

    const req = new Request('http://localhost:3000/api/scraper', {
      method: 'POST',
      body: JSON.stringify({ niche: 'Coding' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.keyword).toBe('nextjs 16 tutorial');
    expect(data.postUrl).toBe('/blog/mastering-nextjs-16');
  });

  it('handles empty trend results gracefully', async () => {
    vi.mocked(agentsModule.runTrendScraper).mockResolvedValueOnce([]);

    const req = new Request('http://localhost:3000/api/scraper', {
      method: 'POST',
      body: JSON.stringify({ niche: 'Unknown' }),
    });

    const res = await POST(req);
    const data = await res.json();
    expect(data.message).toContain('No high-growth');
  });
});
