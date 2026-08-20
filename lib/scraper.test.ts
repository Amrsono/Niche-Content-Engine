import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchGoogleTrends, scrapeTikTokTrends } from './scraper';
import axios from 'axios';

vi.mock('axios');

describe('Trend Scrapers (lib/scraper.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and parses Google Trends RSS items', async () => {
    const mockRssXml = `
      <rss version="2.0">
        <channel>
          <item>
            <title>Next.js 16 Released</title>
            <ht:approx_traffic>100K+</ht:approx_traffic>
            <description>New Next.js version features</description>
            <pubDate>Thu, 20 Aug 2026 12:00:00 GMT</pubDate>
          </item>
        </channel>
      </rss>
    `;

    vi.mocked(axios.get).mockResolvedValueOnce({ data: mockRssXml });

    const trends = await fetchGoogleTrends();
    expect(trends).toHaveLength(1);
    expect(trends[0].title).toBe('Next.js 16 Released');
    expect(trends[0].traffic).toBe('100K+');
  });

  it('handles Google Trends fetch error gracefully by returning empty array', async () => {
    vi.mocked(axios.get).mockRejectedValueOnce(new Error('Network error'));
    const trends = await fetchGoogleTrends();
    expect(trends).toEqual([]);
  });

  it('returns structured TikTok Creative Center trends', async () => {
    const tiktok = await scrapeTikTokTrends();
    expect(tiktok.length).toBeGreaterThan(0);
    expect(tiktok[0].keyword).toBeDefined();
    expect(tiktok[0].growth).toBeDefined();
  });
});
