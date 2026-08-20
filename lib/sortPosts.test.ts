import { describe, it, expect } from 'vitest';
import { filterPosts, searchPosts, sortPosts, calculatePostMetrics } from './sortPosts';

describe('Post Sorting and Filtering Utilities', () => {
  const samplePosts = [
    {
      id: '1',
      title: 'Mastering AI Automations in 2026',
      keyword: 'ai automation',
      category: 'AI',
      publishedAt: new Date().toISOString(),
      views: 100,
      adClicks: 5,
    },
    {
      id: '2',
      title: 'Top Solar Gear for Off-Grid Living',
      keyword: 'solar gear',
      category: 'Tech',
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      views: 250,
      adClicks: 20,
    },
    {
      id: '3',
      title: 'Sustainable Living Starter Kit',
      keyword: 'sustainability',
      category: 'Eco',
      publishedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(), // 40 days ago
      views: 50,
      adClicks: 1,
    },
  ];

  describe('filterPosts', () => {
    it('returns all posts when filters are "all"', () => {
      const res = filterPosts(samplePosts, 'all', 'all');
      expect(res).toHaveLength(3);
    });

    it('filters by category accurately (case-insensitive)', () => {
      const res = filterPosts(samplePosts, 'all', 'ai');
      expect(res).toHaveLength(1);
      expect(res[0].id).toBe('1');
    });

    it('filters by time range "today"', () => {
      const res = filterPosts(samplePosts, 'today', 'all');
      expect(res).toHaveLength(1);
      expect(res[0].id).toBe('1');
    });

    it('filters by time range "week"', () => {
      const res = filterPosts(samplePosts, 'week', 'all');
      expect(res).toHaveLength(2);
    });

    it('filters by time range "month"', () => {
      const res = filterPosts(samplePosts, 'month', 'all');
      expect(res).toHaveLength(2);
    });
  });

  describe('searchPosts', () => {
    it('returns all posts when search query is empty', () => {
      expect(searchPosts(samplePosts, '')).toHaveLength(3);
      expect(searchPosts(samplePosts, '   ')).toHaveLength(3);
    });

    it('matches against post title', () => {
      const res = searchPosts(samplePosts, 'solar');
      expect(res).toHaveLength(1);
      expect(res[0].title).toContain('Solar');
    });

    it('matches against keyword', () => {
      const res = searchPosts(samplePosts, 'sustainability');
      expect(res).toHaveLength(1);
      expect(res[0].keyword).toBe('sustainability');
    });
  });

  describe('sortPosts', () => {
    it('sorts by views in descending order', () => {
      const sorted = sortPosts(samplePosts, 'views', 'desc');
      expect(sorted[0].views).toBe(250);
      expect(sorted[2].views).toBe(50);
    });

    it('sorts by views in ascending order', () => {
      const sorted = sortPosts(samplePosts, 'views', 'asc');
      expect(sorted[0].views).toBe(50);
      expect(sorted[2].views).toBe(250);
    });

    it('sorts by title alphabetically in ascending order', () => {
      const sorted = sortPosts(samplePosts, 'title', 'asc');
      expect(sorted[0].id).toBe('1'); // "Mastering AI..."
      expect(sorted[1].id).toBe('3'); // "Sustainable Living..."
      expect(sorted[2].id).toBe('2'); // "Top Solar..."
    });
  });

  describe('calculatePostMetrics', () => {
    it('calculates totals and CTR accurately', () => {
      const metrics = calculatePostMetrics(samplePosts);
      expect(metrics.totalViews).toBe(400);
      expect(metrics.totalClicks).toBe(26);
      expect(metrics.avgCtr).toBe('6.5'); // (26 / 400) * 100 = 6.5%
    });

    it('handles zero views safely without dividing by zero', () => {
      const metrics = calculatePostMetrics([]);
      expect(metrics.totalViews).toBe(0);
      expect(metrics.totalClicks).toBe(0);
      expect(metrics.avgCtr).toBe('0.0');
    });
  });
});
