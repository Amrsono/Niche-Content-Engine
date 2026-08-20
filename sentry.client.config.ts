/**
 * Sentry Client-Side Configuration
 * Initializes Sentry error monitoring for the Next.js browser runtime.
 * SENTRY_DSN must be set in environment variables to activate.
 * When SENTRY_DSN is absent, Sentry initializes in no-op mode with no errors.
 */
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Capture 10% of transactions in production for performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Only activate debug output during development
  debug: process.env.NODE_ENV === 'development',

  // Replay 10% of all sessions, 100% of sessions with errors
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Ensure client-side integration only loads when DSN is configured
  enabled: Boolean(process.env.SENTRY_DSN),
});
