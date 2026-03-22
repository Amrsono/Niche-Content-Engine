"use client";

const ANALYTICS_KEY = "pulse-analytics";

interface PostAnalytics {
  views: number;
  adClicks: number;
  lastViewed?: string;
}

type AnalyticsStore = Record<string, PostAnalytics>;

function getStore(): AnalyticsStore {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(ANALYTICS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveStore(store: AnalyticsStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ANALYTICS_KEY, JSON.stringify(store));
}

/** Call on every blog post page load */
export function trackView(slug: string) {
  const store = getStore();
  if (!store[slug]) store[slug] = { views: 0, adClicks: 0 };
  store[slug].views += 1;
  store[slug].lastViewed = new Date().toISOString();
  saveStore(store);
}

/** Call when an ad is clicked */
export function trackAdClick(slug: string) {
  const store = getStore();
  if (!store[slug]) store[slug] = { views: 0, adClicks: 0 };
  store[slug].adClicks += 1;
  saveStore(store);
}

/** Get analytics for a specific post */
export function getPostAnalytics(slug: string): PostAnalytics {
  const store = getStore();
  return store[slug] || { views: 0, adClicks: 0 };
}

/** Get all analytics */
export function getAllAnalytics(): AnalyticsStore {
  return getStore();
}
