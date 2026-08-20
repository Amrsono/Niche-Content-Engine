import { describe, it, expect, vi } from 'vitest';
import { GET } from './route';

vi.mock('@/lib/storage', () => ({
  getPosts: vi.fn().mockResolvedValue([
    { id: '1', title: 'Post 1', slug: 'post-1' },
    { id: '2', title: 'Post 2', slug: 'post-2' },
  ]),
}));

describe('GET /api/posts', () => {
  it('returns all stored blog posts', async () => {
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.posts).toHaveLength(2);
  });
});
