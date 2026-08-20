import type { Post } from '../types';

let mockPosts: Post[] = [
  {
    id: 'post-test-1',
    title: 'Top AI Innovations in 2026',
    slug: 'top-ai-innovations-2026',
    content: '<h2>Introduction</h2><p>Here is great content.</p>',
    metaDescription: 'Discover top AI innovations in 2026.',
    ogImageUrl: 'https://image.pollinations.ai/prompt/ai.jpg',
    publishedAt: new Date().toISOString(),
    status: 'published',
    keyword: 'ai innovations',
    category: 'AI & Tech',
  },
  {
    id: 'post-test-2',
    title: 'Sustainable Energy Solutions',
    slug: 'sustainable-energy-solutions',
    content: '<h2>Solar Power</h2><p>Solar is leading the way.</p>',
    metaDescription: 'Sustainable energy trends and tools.',
    ogImageUrl: 'https://image.pollinations.ai/prompt/energy.jpg',
    publishedAt: new Date().toISOString(),
    status: 'published',
    keyword: 'sustainable energy',
    category: 'Green Tech',
  },
];

const mockSettings: Record<string, unknown> = {};

export function resetMockStorage(initialPosts: Post[] = []): void {
  mockPosts = [...initialPosts];
  for (const k of Object.keys(mockSettings)) {
    delete mockSettings[k];
  }
}

export async function getPosts(): Promise<Post[]> {
  return [...mockPosts];
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  return mockPosts.find((p) => p.slug === slug) || null;
}

export async function savePost(post: Omit<Post, 'id' | 'slug' | 'publishedAt'>): Promise<Post> {
  const newPost: Post = {
    ...post,
    id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    slug: post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    publishedAt: new Date().toISOString(),
  };
  mockPosts.unshift(newPost);
  return newPost;
}

export async function updatePost(id: string, updates: Partial<Post>): Promise<Post | null> {
  const idx = mockPosts.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  mockPosts[idx] = { ...mockPosts[idx], ...updates };
  return mockPosts[idx];
}

export async function deletePost(id: string): Promise<boolean> {
  const initialLen = mockPosts.length;
  mockPosts = mockPosts.filter((p) => p.id !== id);
  return mockPosts.length < initialLen;
}

export async function saveSettings<T>(key: string, value: T): Promise<void> {
  mockSettings[key] = value;
}

export async function getSettings<T>(key: string): Promise<T | null> {
  return (mockSettings[key] as T) || null;
}
