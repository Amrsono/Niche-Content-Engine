import { describe, it, expect, vi } from 'vitest';
import { GET } from './route';

vi.mock('@/lib/scraper', () => ({
  fetchGoogleTrends: vi.fn().mockResolvedValue([
    { title: 'Google Trend 1', traffic: '20K+' },
  ]),
  scrapeTikTokTrends: vi.fn().mockResolvedValue([
    { keyword: '#tiktoktrend', growth: '+150%' },
  ]),
}));

describe('GET /api/trends', () => {
  it('combines Google and TikTok trends with coordinate mappings', async () => {
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.trends.length).toBeGreaterThan(0);
    expect(data.trends[0].keyword).toBe('Google Trend 1');
    expect(data.trends[0].top).toBeDefined();
    expect(data.trends[0].left).toBeDefined();
  });
});
