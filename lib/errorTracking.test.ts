import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @sentry/nextjs before importing our module so the SDK is never called for real
vi.mock('@sentry/nextjs', () => ({
  withScope: vi.fn((cb) => cb({ setTag: vi.fn(), setUser: vi.fn(), setExtras: vi.fn() })),
  captureException: vi.fn(() => 'sentry-event-id-123'),
  captureMessage: vi.fn(() => 'sentry-msg-id-456'),
}));

import { captureException, captureMessage, errorTracker } from './errorTracking';

describe('Error Tracking Module (lib/errorTracking.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SENTRY_DSN;
  });

  it('returns null when SENTRY_DSN is not set', () => {
    const result = captureException(new Error('Test error'));
    expect(result).toBeNull();
  });

  it('captureMessage returns null when SENTRY_DSN is not set', () => {
    const result = captureMessage('Test message');
    expect(result).toBeNull();
  });

  it('exposes isConfigured as false when SENTRY_DSN is absent', () => {
    expect(errorTracker.isConfigured).toBe(false);
  });

  it('exposes isConfigured as true when SENTRY_DSN is present', () => {
    process.env.SENTRY_DSN = 'https://fake@sentry.io/123';
    expect(errorTracker.isConfigured).toBe(true);
  });

  it('forwards to Sentry when SENTRY_DSN is set', async () => {
    process.env.SENTRY_DSN = 'https://fake@sentry.io/123';
    const Sentry = await import('@sentry/nextjs');

    captureException(new Error('Wired error'), { module: 'TestModule' });

    expect(Sentry.withScope).toHaveBeenCalled();
    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error));
  });
});
