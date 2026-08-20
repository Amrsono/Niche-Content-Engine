# Security Policy & Architecture

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

---

## Security Model & Authentication

### 1. Admin Access Model (`NEXT_PUBLIC_ADMIN_EMAILS`)
- Administrative features (such as `/admin/indexing`, manual trigger cycles, and global configuration) are restricted via **Clerk Authentication**.
- The environment variable `NEXT_PUBLIC_ADMIN_EMAILS` accepts a comma-separated list of authorized email addresses.
- Both client-side navigation guards (`isUserAdmin`) and server-side route handlers enforce administrative role validation before executing privileged operations.

> [!IMPORTANT]
> Always enforce strict server-side authorization in API routes handling publishing, deletion, or secret updates. Client-side route checks provide UI convenience, but the API handlers validate session identity and email claim.

### 2. Secrets & API Keys Boundary
- **Never expose private server-side secrets** in `NEXT_PUBLIC_` variables.
- AI provider keys (`GROQ_API_KEY`, `GEMINI_API_KEY`, `OPENAI_API_KEY`), social publishing tokens (`TIKTOK_CLIENT_SECRET`, `TWITTER_API_SECRET`, `INSTAGRAM_ACCESS_TOKEN`), and CMS credentials must remain strictly server-side.
- All environment variables are validated at runtime and startup using strict Zod schemas in `lib/env.ts`.

### 3. Automated Dependency Scanning
- High-severity and critical vulnerability checks are enforced via `npm audit --audit-level=high` in continuous integration.
- Dependabot provides weekly security and version upgrade PRs.

---

## Reporting a Vulnerability

If you discover a security vulnerability within Niche-Content-Engine:
1. **Do not create a public issue.**
2. Email details to `security@niche-content-engine.dev` or the repository maintainer.
3. Include clear steps to reproduce, affected versions, and potential impact.
4. Maintainers will acknowledge receipt within 48 hours and coordinate a fix and release timeline.
