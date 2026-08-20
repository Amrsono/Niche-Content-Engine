import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'rebrand.ly' },
      { protocol: 'https', hostname: 'image.pollinations.ai' },
      { protocol: 'https', hostname: 'gen.pollinations.ai' },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  // Suppress Sentry CLI output during build
  silent: !process.env.CI,

  // Disable source map upload (requires SENTRY_AUTH_TOKEN); enable in production CI
  widenClientFileUpload: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Only upload source maps when SENTRY_DSN is configured
  sourcemaps: {
    disable: !process.env.SENTRY_DSN,
  },
});
