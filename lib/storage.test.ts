import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPosts, getPostBySlug, savePost, updatePost, saveSettings, getSettings } from './storage';
import fs from 'fs';

vi.mock('fs', () => {
  const existsSync = vi.fn();
  const readFileSync = vi.fn();
  const writeFileSync = vi.fn();
  const mkdirSync = vi.fn();

  return {
    default: { existsSync, readFileSync, writeFileSync, mkdirSync },
    existsSync,
    readFileSync,
    writeFileSync,
    mkdirSync,
  };
});

describe('Storage Layer (lib/storage.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.REDIS_URL;
    delete process.env.KV_URL;
  });

  it('reads posts from filesystem fallback when Redis is absent', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify([
        {
          id: 'post-1',
          title: 'Stored Post',
          slug: 'stored-post',
          content: 'Body',
          metaDescription: 'Desc',
          publishedAt: new Date().toISOString(),
          status: 'published',
          keyword: 'stored',
        },
      ])
    );

    const posts = await getPosts();
    expect(posts).toHaveLength(1);
    expect(posts[0].slug).toBe('stored-post');
  });

  it('finds post by slug', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify([
        {
          id: 'p-target',
          title: 'Target Title',
          slug: 'target-slug',
          content: 'Body',
          metaDescription: 'Desc',
          publishedAt: new Date().toISOString(),
          status: 'published',
          keyword: 'target',
        },
      ])
    );

    const post = await getPostBySlug('target-slug');
    expect(post).not.toBeNull();
    expect(post?.title).toBe('Target Title');
  });

  it('saves new post and writes to filesystem', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('[]');

    const post = await savePost({
      title: 'New Dynamic Post',
      content: '<p>Content</p>',
      metaDescription: 'Dynamic Description',
      status: 'published',
      keyword: 'dynamic',
    });

    expect(post.slug).toBe('new-dynamic-post');
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it('updates existing post', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify([
        {
          id: 'update-id',
          title: 'Original Title',
          slug: 'original-title',
          content: 'Content',
          metaDescription: 'Desc',
          publishedAt: new Date().toISOString(),
          status: 'published',
          keyword: 'kw',
        },
      ])
    );

    const updated = await updatePost('update-id', { title: 'Updated Title' });
    expect(updated?.title).toBe('Updated Title');
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it('saves and retrieves settings', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({ test_setting: { key: 'value' } })
    );

    await saveSettings('test_setting', { key: 'value' });
    const setting = await getSettings<{ key: string }>('test_setting');
    expect(setting?.key).toBe('value');
  });
});
