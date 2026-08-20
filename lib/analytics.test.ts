import { describe, it, expect, beforeEach } from 'vitest';
import { trackView, trackAdClick, getPostAnalytics, getAllAnalytics } from './analytics';

describe('Analytics Tracker (lib/analytics.ts)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('tracks views for a given post slug', () => {
    trackView('post-1');
    trackView('post-1');
    const analytics = getPostAnalytics('post-1');
    expect(analytics.views).toBe(2);
    expect(analytics.adClicks).toBe(0);
    expect(analytics.lastViewed).toBeDefined();
  });

  it('tracks ad clicks for a post', () => {
    trackAdClick('post-2');
    const analytics = getPostAnalytics('post-2');
    expect(analytics.adClicks).toBe(1);
    expect(analytics.views).toBe(0);
  });

  it('returns default zeroes for unviewed post', () => {
    const analytics = getPostAnalytics('unviewed-post');
    expect(analytics.views).toBe(0);
    expect(analytics.adClicks).toBe(0);
  });

  it('returns full store of analytics', () => {
    trackView('post-a');
    trackView('post-b');
    const store = getAllAnalytics();
    expect(Object.keys(store)).toContain('post-a');
    expect(Object.keys(store)).toContain('post-b');
  });
});
