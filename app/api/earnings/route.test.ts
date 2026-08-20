import { describe, it, expect, vi } from 'vitest';
import { GET } from './route';

vi.mock('@/lib/storage', () => ({
  getPosts: vi.fn().mockResolvedValue([
    { id: '1', title: 'Post 1', slug: 'post-1', publishedAt: new Date().toISOString() },
    { id: '2', title: 'Post 2', slug: 'post-2', publishedAt: new Date().toISOString() },
  ]),
}));

describe('GET /api/earnings', () => {
  it('calculates AdSense and Affiliate metrics and chart data', async () => {
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.stats.adsense).toBeDefined();
    expect(data.stats.affiliates).toBeDefined();
    expect(data.stats.chartData).toHaveLength(7);
  });
});
