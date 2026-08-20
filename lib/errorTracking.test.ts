import { describe, it, expect, vi, beforeEach } from 'vitest';
import { captureException, captureMessage, errorTracker } from './errorTracking';

describe('Error Tracking Module (lib/errorTracking.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SENTRY_DSN;
  });

  it('degrades gracefully and returns null when SENTRY_DSN is unset', () => {
    const errorId = captureException(new Error('Test runtime failure'), { module: 'TEST' });
    expect(errorId).toBeNull();
    const msgId = captureMessage('Test message', 'info');
    expect(msgId).toBeNull();
  });

  it('exposes isConfigured boolean accurately', () => {
    expect(typeof errorTracker.isConfigured).toBe('boolean');
  });
});
