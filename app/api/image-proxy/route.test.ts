import { describe, it, expect } from 'vitest';
import { GET } from './route';

describe('GET /api/image-proxy', () => {
  it('returns 400 when url parameter is missing', async () => {
    const req = new Request('http://localhost:3000/api/image-proxy');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns SVG placeholder on local loop detection', async () => {
    const req = new Request('http://localhost:3000/api/image-proxy?url=%2Fapi%2Fimage-proxy');
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('image/svg+xml');
  });
});
