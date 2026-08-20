/**
 * Error Tracking Client
 * Delegates to the @sentry/nextjs SDK when SENTRY_DSN is configured.
 * Degrades gracefully (no-op) when SENTRY_DSN is absent so local dev and
 * test environments never fail due to missing observability configuration.
 */
import * as Sentry from '@sentry/nextjs';

interface ErrorContext {
  module?: string;
  userId?: string;
  [key: string]: unknown;
}

class ErrorTracker {
  get isConfigured(): boolean {
    return Boolean(process.env.SENTRY_DSN);
  }

  /**
   * Captures an exception and forwards it to Sentry.
   * Returns a Sentry event ID string, or null if tracking is disabled.
   */
  captureException(error: unknown, context?: ErrorContext): string | null {
    if (!this.isConfigured) return null;

    try {
      return Sentry.withScope((scope) => {
        if (context?.module) scope.setTag('module', context.module);
        if (context?.userId) scope.setUser({ id: context.userId });

        // Attach any extra context keys
        const { module: _m, userId: _u, ...extras } = context ?? {};
        if (Object.keys(extras).length > 0) scope.setExtras(extras);

        return Sentry.captureException(error);
      });
    } catch {
      // Never let error-tracking failures bubble up
      return null;
    }
  }

  /**
   * Captures a plain message event.
   * Returns a Sentry event ID string, or null if tracking is disabled.
   */
  captureMessage(
    message: string,
    level: Sentry.SeverityLevel = 'info',
    context?: ErrorContext
  ): string | null {
    if (!this.isConfigured) return null;

    try {
      return Sentry.withScope((scope) => {
        if (context?.module) scope.setTag('module', context.module);
        return Sentry.captureMessage(message, level);
      });
    } catch {
      return null;
    }
  }
}

export const errorTracker = new ErrorTracker();

// Convenience function exports to keep call sites clean
export function captureException(error: unknown, context?: ErrorContext): string | null {
  return errorTracker.captureException(error, context);
}

export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: ErrorContext
): string | null {
  return errorTracker.captureMessage(message, level, context);
}
