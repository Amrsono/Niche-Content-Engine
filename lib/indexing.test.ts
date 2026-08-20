import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requestIndexing, batchRequestIndexing, getIndexingStatus } from './indexing';

describe('Google Search Indexing (lib/indexing.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  });

  it('runs mock indexing when GOOGLE_SERVICE_ACCOUNT_JSON is missing', async () => {
    const result = await requestIndexing('https://example.com/blog/sample-post');
    expect(result.success).toBe(true);
    expect(result.error).toBe('mock_mode');
  });

  it('handles batch indexing in mock mode', async () => {
    const batch = await batchRequestIndexing([
      'https://example.com/blog/post-1',
      'https://example.com/blog/post-2',
    ]);
    expect(batch.submitted).toBe(2);
    expect(batch.results).toHaveLength(2);
    expect(batch.results[0].success).toBe(true);
  });

  it('returns mock indexing status metadata', async () => {
    const status = await getIndexingStatus('https://example.com/blog/post-1');
    expect(status.url).toBe('https://example.com/blog/post-1');
    expect(status.mock).toBe(true);
  });
});
