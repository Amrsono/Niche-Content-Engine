/**
 * Production Error Tracking Module.
 * Integrates optional Sentry / webhook reporting with graceful degradation
 * when SENTRY_DSN is unset.
 */

export interface ErrorTrackingContext {
  module?: string;
  userEmail?: string;
  extra?: Record<string, unknown>;
}

export interface ErrorTrackingClient {
  isConfigured: boolean;
  captureException: (error: unknown, context?: ErrorTrackingContext) => string | null;
  captureMessage: (message: string, level?: 'info' | 'warning' | 'error') => string | null;
}

function initErrorTracker(): ErrorTrackingClient {
  const dsn = process.env.SENTRY_DSN;
  const isConfigured = Boolean(dsn && dsn.trim().length > 0);

  return {
    isConfigured,
    captureException: (error: unknown, context?: ErrorTrackingContext) => {
      const errorId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      
      if (!isConfigured) {
        // Degrade gracefully in dev/test/non-configured environments
        return null;
      }

      // If SENTRY_DSN is configured, dispatch structured error report
      try {
        const payload = {
          event_id: errorId,
          timestamp: new Date().toISOString(),
          platform: 'node',
          level: 'error',
          exception: {
            values: [
              {
                type: error instanceof Error ? error.name : 'UnknownError',
                value: error instanceof Error ? error.message : String(error),
                stacktrace: error instanceof Error ? error.stack : undefined,
              },
            ],
          },
          tags: {
            module: context?.module || 'GENERAL',
            environment: process.env.NODE_ENV || 'development',
          },
          extra: context?.extra,
          user: context?.userEmail ? { email: context.userEmail } : undefined,
        };

        // Non-blocking telemetry dispatch
        if (typeof fetch !== 'undefined') {
          fetch(dsn as string, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }).catch(() => {
            // Silently ignore telemetry transport errors to prevent cascade
          });
        }
      } catch {
        // Ignore internal tracking errors
      }

      return errorId;
    },
    captureMessage: (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
      if (!isConfigured) return null;
      return `msg_${Date.now()}_${level}_${message.slice(0, 10)}`;
    },
  };
}

export const errorTracker = initErrorTracker();

export function captureException(error: unknown, context?: ErrorTrackingContext): string | null {
  return errorTracker.captureException(error, context);
}

export function captureMessage(message: string, level?: 'info' | 'warning' | 'error'): string | null {
  return errorTracker.captureMessage(message, level);
}
