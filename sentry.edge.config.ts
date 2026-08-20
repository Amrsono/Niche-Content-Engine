/**
 * Sentry Edge Runtime Configuration
 * Initializes Sentry for Next.js edge runtime (middleware, edge API routes).
 */
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: process.env.NODE_ENV === 'development',
  enabled: Boolean(process.env.SENTRY_DSN),
});
