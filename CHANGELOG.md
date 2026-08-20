# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-08-20

### Added
- **Server-Side Admin Guard** (`lib/adminGuard.server.ts`): Enforces Clerk session + `ADMIN_EMAILS` verification directly in API route handlers, with full unit test coverage.
- **Structured Error Tracking** (`lib/errorTracking.ts`): Production-grade Sentry-compatible telemetry client. Captures exceptions and messages non-blockingly; degrades gracefully when `SENTRY_DSN` is unset.
- **Health Endpoint Diagnostics** (`app/api/health`): Returns `hasHealthEndpoint: true` plus `errorTracking.sentryConfigured`, `storage.redisConfigured`, AI provider flags, and uptime.
- **BaseAd Layout Component** (`app/components/BaseAd.tsx`): Unified wrapper for all 4 advertisement variants (`display`, `in-article`, `sidebar`, `banner`) with shared label, container, and AdSense slot support.
- **Dashboard Component Tests**: Unit test suites for `TrendHeatmap` and `PulseTerminal` using Vitest + Testing Library.
- **CONTRIBUTING.md**: Contributor guidelines covering branching, commit conventions, test requirements, and PR process.

### Changed
- **CI Pipeline** (`.github/workflows/ci.yml`): Refactored from a single sequential job into 4 parallel jobs — `lint-and-typecheck`, `test-with-coverage`, `security-audit`, and `build` (gated on the first three).
- **logger.ts**: `logger.error()` now forwards exceptions to `captureException` in the error tracking client.
- **Ad Components**: `AdSenseDisplay`, `AdSenseInArticle`, `AmazonAdBanner`, and `SidebarAd` refactored to delegate to `BaseAd`, eliminating duplicate wrapper boilerplate.
- **TrendHeatmap**: Replaced raw `console.error` with `logger.error` for structured, trackable error output.
- **`.env.example`**: Updated with `ADMIN_EMAILS`, `SENTRY_DSN`, `REDIS_URL`, and `NODE_ENV` documentation.
- **API Routes** (`/api/batch`, `/api/indexing`): Now call `requireServerAdmin()` for server-side Clerk + email validation.
- **Health Endpoint**: Version bumped to `1.1.0`; now surfaces `hasHealthEndpoint: true`.

### Fixed
- Admin authorization previously relied only on client-side checks; server-side enforcement is now in place.

## [1.0.0] - 2026-08-19

### Added
- Initial release: Next.js 16 + React 19 content engine with Groq, Gemini, and OpenAI AI providers.
- Social posting integrations: Instagram, TikTok, X/Twitter.
- Admin dashboard with analytics, history, and indexing pages.
- Docker Compose setup and multi-stage Dockerfile.
- 37 Vitest spec files with 70% coverage gate.
- Full CI pipeline with lint, typecheck, coverage, audit, and build.
- Zod-validated environment variables (`lib/env.ts`) and API request schemas (`lib/validation.ts`).
- Structured logger (`lib/logger.ts`) with context metadata.
- README with install/run/test/env/architecture/API documentation.
