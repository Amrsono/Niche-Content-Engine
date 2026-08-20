import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from './route';
import * as clerkServer from '@clerk/nextjs/server';
import * as indexingModule from '@/lib/indexing';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

vi.mock('@/lib/indexing', () => ({
  batchRequestIndexing: vi.fn(),
  getIndexingStatus: vi.fn(),
}));

vi.mock('@/lib/storage', () => ({
  getPosts: vi.fn().mockResolvedValue([
    { slug: 'post-1', title: 'Post 1' },
    { slug: 'post-2', title: 'Post 2' },
  ]),
}));

describe('Indexing API (/api/indexing)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_ADMIN_EMAILS = 'admin@example.com';
  });

  describe('POST /api/indexing', () => {
    it('returns 401 when unauthenticated', async () => {
      vi.mocked(clerkServer.auth).mockResolvedValueOnce({ userId: null } as unknown as ReturnType<typeof clerkServer.auth> extends Promise<infer R> ? R : never);

      const req = new Request('http://localhost:3000/api/indexing', {
        method: 'POST',
        body: JSON.stringify({ mode: 'latest' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it('returns 403 when non-admin', async () => {
      vi.mocked(clerkServer.auth).mockResolvedValueOnce({ userId: 'u_1' } as unknown as ReturnType<typeof clerkServer.auth> extends Promise<infer R> ? R : never);
      vi.mocked(clerkServer.currentUser).mockResolvedValueOnce({
        emailAddresses: [{ emailAddress: 'user@gmail.com' }],
      } as unknown as ReturnType<typeof clerkServer.currentUser> extends Promise<infer R> ? R : never);

      const req = new Request('http://localhost:3000/api/indexing', {
        method: 'POST',
        body: JSON.stringify({ mode: 'latest' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
    });

    it('executes indexing submission for authorized admin in custom mode', async () => {
      vi.mocked(clerkServer.auth).mockResolvedValueOnce({ userId: 'u_admin' } as unknown as ReturnType<typeof clerkServer.auth> extends Promise<infer R> ? R : never);
      vi.mocked(clerkServer.currentUser).mockResolvedValueOnce({
        emailAddresses: [{ emailAddress: 'admin@example.com' }],
      } as unknown as ReturnType<typeof clerkServer.currentUser> extends Promise<infer R> ? R : never);

      vi.mocked(indexingModule.batchRequestIndexing).mockResolvedValueOnce({
        submitted: 1,
        results: [{ url: 'https://mysite.com/blog/post-1', success: true }],
      });

      const req = new Request('http://localhost:3000/api/indexing', {
        method: 'POST',
        body: JSON.stringify({ mode: 'custom', urls: ['https://mysite.com/blog/post-1'] }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.submitted).toBe(1);
    });
  });

  describe('GET /api/indexing', () => {
    it('returns 400 when url query parameter is missing', async () => {
      vi.mocked(clerkServer.auth).mockResolvedValueOnce({ userId: 'u_admin' } as unknown as ReturnType<typeof clerkServer.auth> extends Promise<infer R> ? R : never);
      vi.mocked(clerkServer.currentUser).mockResolvedValueOnce({
        emailAddresses: [{ emailAddress: 'admin@example.com' }],
      } as unknown as ReturnType<typeof clerkServer.currentUser> extends Promise<infer R> ? R : never);

      const req = new Request('http://localhost:3000/api/indexing');
      const res = await GET(req);
      expect(res.status).toBe(400);
    });

    it('returns indexing status for queried URL', async () => {
      vi.mocked(clerkServer.auth).mockResolvedValueOnce({ userId: 'u_admin' } as unknown as ReturnType<typeof clerkServer.auth> extends Promise<infer R> ? R : never);
      vi.mocked(clerkServer.currentUser).mockResolvedValueOnce({
        emailAddresses: [{ emailAddress: 'admin@example.com' }],
      } as unknown as ReturnType<typeof clerkServer.currentUser> extends Promise<infer R> ? R : never);

      vi.mocked(indexingModule.getIndexingStatus).mockResolvedValueOnce({
        url: 'https://mysite.com/blog/post-1',
        latestUpdate: { type: 'URL_UPDATED', notifyTime: '2026-08-20T12:00:00Z' },
      });

      const req = new Request('http://localhost:3000/api/indexing?url=https%3A%2F%2Fmysite.com%2Fblog%2Fpost-1');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.url).toBe('https://mysite.com/blog/post-1');
    });
  });
});
