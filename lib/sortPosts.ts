import type { Post } from './types';

export type TimeFilter = 'all' | 'today' | 'week' | 'month';
export type SortKey = 'publishedAt' | 'views' | 'adClicks' | 'title';
export type SortDir = 'asc' | 'desc';

export interface EnrichedPost extends Post {
  views: number;
  adClicks: number;
}

/**
 * Filter posts by time range and category.
 */
export function filterPosts<T extends { publishedAt: string; category?: string }>(
  posts: T[],
  timeFilter: TimeFilter = 'all',
  categoryFilter: string = 'all'
): T[] {
  return posts.filter((post) => {
    // 1. Time Filter
    if (timeFilter !== 'all') {
      const postDate = new Date(post.publishedAt);
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      if (timeFilter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (postDate < today) return false;
      } else if (timeFilter === 'week') {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        if (postDate < lastWeek) return false;
      } else if (timeFilter === 'month') {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        if (postDate < lastMonth) return false;
      }
    }

    // 2. Category Filter
    if (categoryFilter !== 'all') {
      const cat = post.category || 'General';
      if (cat.toLowerCase() !== categoryFilter.toLowerCase()) return false;
    }

    return true;
  });
}

/**
 * Filter posts by search query against title or keyword.
 */
export function searchPosts<T extends { title: string; keyword: string }>(
  posts: T[],
  searchQuery: string
): T[] {
  if (!searchQuery || !searchQuery.trim()) return posts;
  const q = searchQuery.toLowerCase().trim();
  return posts.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.keyword.toLowerCase().includes(q)
  );
}

/**
 * Sort enriched posts by key (publishedAt, views, adClicks, title) and direction.
 */
export function sortPosts<T extends { publishedAt: string; title: string; views?: number; adClicks?: number }>(
  posts: T[],
  sortKey: SortKey = 'publishedAt',
  sortDir: SortDir = 'desc'
): T[] {
  return [...posts].sort((a, b) => {
    let aVal: string | number = a[sortKey] ?? 0;
    let bVal: string | number = b[sortKey] ?? 0;

    if (sortKey === 'publishedAt') {
      aVal = new Date(a.publishedAt).getTime();
      bVal = new Date(b.publishedAt).getTime();
    } else if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = (bVal as string).toLowerCase();
    }

    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Calculates aggregate analytics (total views, clicks, CTR).
 */
export function calculatePostMetrics(posts: { views?: number; adClicks?: number }[]): {
  totalViews: number;
  totalClicks: number;
  avgCtr: string;
} {
  const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalClicks = posts.reduce((sum, p) => sum + (p.adClicks || 0), 0);
  const avgCtr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : '0.0';
  return { totalViews, totalClicks, avgCtr };
}
