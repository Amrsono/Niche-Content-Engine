import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all external dependencies to ensure fully offline test execution
vi.mock('@/lib/niche-manager', () => ({
  getNextNiche: vi.fn().mockResolvedValue('test-topic'),
  addDiscoveredTopics: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/agents', () => ({
  generateArticle: vi.fn().mockResolvedValue({
    title: 'Test Article',
    content: 'Test content',
    metaDescription: 'Test desc',
    ogImageUrl: undefined,
  }),
  generateOgImage: vi.fn().mockResolvedValue('https://example.com/image.png'),
  publishToLocal: vi.fn().mockResolvedValue({
    status: 'success',
    platform: 'Local-Pulse-Blog',
    url: '/blog/test-article',
    id: 'test-id-123',
  }),
  updatePost: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/scraper', () => ({
  fetchGoogleTrends: vi.fn().mockResolvedValue([]),
  scrapeTikTokTrends: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/indexing', () => ({
  requestIndexing: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/ai/utils', () => ({
  stringifyError: vi.fn((e) => String(e)),
}));

import { GET } from './route';

function makeRequest(authHeader?: string): Request {
  return new Request('http://localhost/api/cron/daily', {
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

describe('GET /api/cron/daily', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CRON_SECRET;
    delete process.env.NODE_ENV;
  });

  it('returns 401 in production when CRON_SECRET is set and header is missing', async () => {
    process.env.CRON_SECRET = 'supersecret';
    process.env.NODE_ENV = 'production';

    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('returns 401 in production when authorization header is wrong', async () => {
    process.env.CRON_SECRET = 'supersecret';
    process.env.NODE_ENV = 'production';

    const res = await GET(makeRequest('Bearer wrongtoken'));
    expect(res.status).toBe(401);
  });

  it('proceeds normally in production with correct CRON_SECRET', async () => {
    process.env.CRON_SECRET = 'supersecret';
    process.env.NODE_ENV = 'production';

    const res = await GET(makeRequest('Bearer supersecret'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.publishedTopic).toBe('test-topic');
  });

  it('allows request in development even without authorization header', async () => {
    process.env.CRON_SECRET = 'supersecret';
    process.env.NODE_ENV = 'development';

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
  });
});
