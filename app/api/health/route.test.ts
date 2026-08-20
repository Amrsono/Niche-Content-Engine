import { describe, it, expect } from 'vitest';
import { GET } from './route';

describe('GET /api/health', () => {
  it('returns healthy status with system metadata and provider flags', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.version).toBe('1.1.0');
    expect(data.hasHealthEndpoint).toBe(true);
    expect(data.features).toBeDefined();
    expect(data.features.ai).toBeDefined();
    expect(data.features.storage).toBeDefined();
    expect(data.features.errorTracking).toBeDefined();
    expect(typeof data.uptimeSeconds).toBe('number');
  });
});
