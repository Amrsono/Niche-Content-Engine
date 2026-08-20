# Contributing to Niche Content Engine

Thank you for taking the time to contribute! This guide covers everything you need to get started.

## Table of Contents
- [Getting Started](#getting-started)
- [Branch Strategy](#branch-strategy)
- [Commit Conventions](#commit-conventions)
- [Code Standards](#code-standards)
- [Test Requirements](#test-requirements)
- [Pull Request Process](#pull-request-process)

---

## Getting Started

### Prerequisites
- Node.js 20+
- npm 10+
- Docker (optional, for running via Docker Compose)

### Setup

```bash
git clone https://github.com/Amrsono/Niche-Content-Engine.git
cd Niche-Content-Engine
cp .env.example .env.local
npm install
npm run dev
```

See the [README](./README.md) for full environment variable setup.

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `master` | Stable, production-ready code |
| `feat/<name>` | New features |
| `fix/<name>` | Bug fixes |
| `chore/<name>` | Dependency updates, config, tooling |
| `refactor/<name>` | Code improvements without behaviour changes |

Always branch off `master` and open a PR to merge back.

---

## Commit Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(optional-scope): short description

Optional longer body explaining why, not what.
```

**Types:**

| Type | When to use |
|------|------------|
| `feat` | New functionality |
| `fix` | Bug fix |
| `refactor` | Code change that doesn't fix a bug or add a feature |
| `test` | Adding or updating tests |
| `docs` | Documentation only changes |
| `ci` | CI/CD pipeline changes |
| `chore` | Dependency updates, tooling, config |
| `perf` | Performance improvements |

**Examples:**
```
feat(api): add retry logic to Groq provider
fix(auth): enforce server-side admin check on batch route
test(ui): add TrendHeatmap unit tests
docs: update .env.example with SENTRY_DSN
```

---

## Code Standards

### TypeScript
- Prefer explicit types over `any`; use `unknown` where the type is genuinely unknown
- Use Zod schemas for all external inputs (API routes, env vars)
- All shared utilities go in `lib/`, not inside `app/`

### Logging
- Use `import { logger } from '@/lib/logger'` — **never** raw `console.log` or `console.error`
- Always pass a context string: `logger.error('message', 'ComponentOrModule', errorData)`

### Error Handling
- API routes must catch unexpected errors and return a structured JSON response
- Production errors should be captured via `captureException` from `@/lib/errorTracking`

### Components
- Client components (`"use client"`) should not contain data fetching logic — use hooks
- Ad components must extend `BaseAd` rather than duplicating wrapper markup
- Avoid inline `style` objects where a CSS module class exists

### Admin-Protected Routes
All routes that mutate data or expose admin-only information must call `requireServerAdmin()`:

```ts
import { requireServerAdmin } from '@/lib/adminGuard.server';

export async function POST(req: Request) {
  const guard = await requireServerAdmin();
  if (!guard.authorized) return guard.errorResponse;
  // ... proceed
}
```

---

## Test Requirements

- **Every new feature or bug fix must ship with tests**
- Coverage gate is **70%** — the CI pipeline will fail if coverage drops below this
- Use **Vitest** + **@testing-library/react** for component tests
- Mock external dependencies (fetch, Clerk, AI providers) — do not make real API calls in tests

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run a specific file
npx vitest run path/to/file.test.ts
```

---

## Pull Request Process

1. **Fork** the repo and create your feature branch from `master`
2. Make your changes in focused, atomic commits following the conventions above
3. Ensure all tests pass: `npm run lint && npm run typecheck && npm run test:coverage`
4. Update `CHANGELOG.md` under the `[Unreleased]` section
5. Open a PR with a clear title and description explaining the **why**
6. Request review — at least one approval is required before merging
7. Squash and merge once approved

---

## Questions?

Open an [issue](https://github.com/Amrsono/Niche-Content-Engine/issues) or start a [discussion](https://github.com/Amrsono/Niche-Content-Engine/discussions).
