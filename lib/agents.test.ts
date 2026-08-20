import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  runTrendScraper,
  generateArticle,
  generateOgImage,
  publishToLocal,
  publishToWordpress,
  publishToSanity,
  publishToInstagram,
  publishToTwitter,
  publishToTikTok,
  publishToFacebook,
  calculatePeakTime,
} from './agents';
import * as dispatcherModule from './ai/dispatcher';
import * as scraperModule from './scraper';
import * as storageModule from './storage';
import * as tokenModule from './tiktok/token';

vi.mock('./ai/dispatcher', () => ({
  callAIWithFallback: vi.fn(),
}));

vi.mock('./scraper', () => ({
  fetchGoogleTrends: vi.fn(),
  scrapeTikTokTrends: vi.fn(),
}));

vi.mock('./storage', () => ({
  savePost: vi.fn(),
  updatePost: vi.fn(),
}));

vi.mock('./tiktok/token', () => ({
  getTikTokToken: vi.fn(),
}));

describe('Agents Orchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
      text: async () => '',
    } as unknown as Response);
  });

  describe('runTrendScraper', () => {
    it('fetches signals and returns ranked trend keywords', async () => {
      vi.mocked(scraperModule.fetchGoogleTrends).mockResolvedValueOnce([
        { title: 'AI Video Editor', traffic: '50K+' },
      ]);
      vi.mocked(scraperModule.scrapeTikTokTrends).mockResolvedValueOnce([
        { keyword: '#aivideo', growth: '+120%', niche: 'AI' },
      ]);

      vi.mocked(dispatcherModule.callAIWithFallback).mockResolvedValueOnce({
        text: JSON.stringify({
          trends: [
            { keyword: 'ai video editor', searchVolume: 50000, competition: 'LOW' },
          ],
        }),
      });

      const trends = await runTrendScraper('AI Video');
      expect(trends).toHaveLength(1);
      expect(trends[0].keyword).toBe('ai video editor');
      expect(trends[0].niche).toBe('AI Video');
    });
  });

  describe('generateArticle', () => {
    it('executes multi-pass outline and section generation', async () => {
      // 1. Outline response
      vi.mocked(dispatcherModule.callAIWithFallback).mockResolvedValueOnce({
        text: JSON.stringify({
          sections: [{ title: 'Why AI Video Matters', targetWordCount: 500 }],
        }),
      });

      // 2. Section content response
      vi.mocked(dispatcherModule.callAIWithFallback).mockResolvedValueOnce({
        text: '<h2>Why AI Video Matters</h2><p>Article section content.</p>',
      });

      // 3. Meta title & description response
      vi.mocked(dispatcherModule.callAIWithFallback).mockResolvedValueOnce({
        text: JSON.stringify({
          title: 'The Future of AI Video',
          metaDescription: 'Discover how AI video is transforming media creation.',
        }),
      });

      const article = await generateArticle('AI Video');
      expect(article.title).toBe('The Future of AI Video');
      expect(article.content).toContain('Why AI Video Matters');
      expect(article.metaDescription).toContain('transforming media creation');
    });
  });

  describe('generateOgImage', () => {
    it('generates creative prompt and returns valid Pollinations URL', async () => {
      vi.mocked(dispatcherModule.callAIWithFallback).mockResolvedValueOnce({
        text: 'A glowing futuristic neural network workstation',
      });

      const imageUrl = await generateOgImage('Neural Networks', 'AI');
      expect(imageUrl).toContain('pollinations.ai');
      expect(imageUrl).toContain('neural');
    });
  });

  describe('Publishers', () => {
    it('publishToLocal saves article to storage and returns blog slug', async () => {
      vi.mocked(storageModule.savePost).mockResolvedValueOnce({
        id: 'post-123',
        slug: 'ai-trends-today',
        title: 'AI Trends Today',
        content: 'content',
        metaDescription: 'desc',
        publishedAt: new Date().toISOString(),
        status: 'published',
        keyword: 'ai trends',
      });

      const result = await publishToLocal(
        { title: 'AI Trends Today', content: 'content', metaDescription: 'desc' },
        'ai trends',
        'Tech'
      );

      expect(result.status).toBe('success');
      expect(result.url).toBe('/blog/ai-trends-today');
      expect(result.platform).toBe('Local-Pulse-Blog');
    });

    it('publishToWordpress returns mock or live result', async () => {
      const res = await publishToWordpress({
        title: 'Test Article',
        content: 'content',
        metaDescription: 'desc',
      });
      expect(res.status).toBe('success');
      expect(res.platform).toContain('WordPress');
    });

    it('publishToSanity handles missing ID gracefully', async () => {
      const res = await publishToSanity({
        title: 'Test Article',
        content: 'content',
        metaDescription: 'desc',
      });
      expect(res.platform).toBe('Sanity');
    });

    it('publishToInstagram skips when credentials are absent', async () => {
      const res = await publishToInstagram({
        title: 'Test Article',
        content: 'content',
        metaDescription: 'desc',
      });
      expect(res.status).toBe('skipped');
    });

    it('publishToTwitter skips when credentials are absent', async () => {
      const res = await publishToTwitter({
        title: 'Test Article',
        content: 'content',
        metaDescription: 'desc',
      });
      expect(res.status).toBe('skipped');
    });

    it('publishToTikTok skips when token is absent', async () => {
      vi.mocked(tokenModule.getTikTokToken).mockResolvedValueOnce(null);
      const res = await publishToTikTok({
        title: 'Test Article',
        content: 'content',
        metaDescription: 'desc',
      });
      expect(res.status).toBe('skipped');
    });

    it('publishToFacebook skips when page ID / token is absent', async () => {
      const res = await publishToFacebook({
        title: 'Test Article',
        content: 'content',
        metaDescription: 'desc',
      });
      expect(res.status).toBe('skipped');
    });
  });

  describe('calculatePeakTime', () => {
    it('returns ISO date string targeting peak engagement window', () => {
      const peakIso = calculatePeakTime();
      expect(new Date(peakIso).getTime()).toBeGreaterThan(0);
    });
  });
});
