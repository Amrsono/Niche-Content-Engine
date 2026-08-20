import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePosts } from './useLocalPosts';

describe('usePosts Hook (lib/useLocalPosts.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches posts on mount and provides getPostBySlug helper', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      json: async () => ({
        success: true,
        posts: [
          { id: '1', title: 'Post 1', slug: 'post-1' },
          { id: '2', title: 'Post 2', slug: 'post-2' },
        ],
      }),
    } as unknown as Response);

    const { result } = renderHook(() => usePosts());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.posts).toHaveLength(2);
    expect(result.current.getPostBySlug('post-1')?.title).toBe('Post 1');
  });
});
