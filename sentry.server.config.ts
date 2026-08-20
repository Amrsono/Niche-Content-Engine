/**
 * Sentry Server-Side Configuration
 * Initializes Sentry error monitoring for Next.js server runtime.
 * SENTRY_DSN must be set in environment variables to activate.
 * When SENTRY_DSN is absent, Sentry initializes in no-op mode with no errors.
 */
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Capture 10% of transactions in production for performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Capture 100% of profiles when tracing is active
  profilesSampleRate: 1.0,

  // Only activate debug output during development
  debug: process.env.NODE_ENV === 'development',

  // Ensure server-side initialization does not block startup
  enabled: Boolean(process.env.SENTRY_DSN),
});
