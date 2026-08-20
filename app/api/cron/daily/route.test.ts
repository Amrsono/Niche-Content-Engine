import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

vi.mock('@/lib/agents', () => ({
  generateArticle: vi.fn().mockResolvedValue({
    title: 'Daily Auto Article',
    content: 'Content',
    metaDescription: 'Desc',
  }),
  generateOgImage: vi.fn().mockResolvedValue('https://image.url/daily.jpg'),
  publishToLocal: vi.fn().mockResolvedValue({
    status: 'success',
    url: '/blog/daily-auto-article',
    platform: 'Local-Pulse-Blog',
    id: 'p-daily',
  }),
  updatePost: vi.fn(),
}));

vi.mock('@/lib/niche-manager', () => ({
  getNextNiche: vi.fn().mockResolvedValue('Next Niche'),
  addDiscoveredTopics: vi.fn(),
}));

vi.mock('@/lib/scraper', () => ({
  fetchGoogleTrends: vi.fn().mockResolvedValue([]),
  scrapeTikTokTrends: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/indexing', () => ({
  requestIndexing: vi.fn().mockResolvedValue({ success: true }),
}));

describe('GET /api/cron/daily', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('runs daily automated discovery and publishing cycle', async () => {
    const req = new Request('http://localhost:3000/api/cron/daily');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.publishedTopic).toBe('Next Niche');
  });
});
