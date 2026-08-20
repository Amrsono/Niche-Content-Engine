import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireServerAdmin } from './adminGuard.server';
import * as clerkServer from '@clerk/nextjs/server';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

describe('Server Admin Guard (lib/adminGuard.server.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_EMAILS = 'admin@example.com,superadmin@example.com';
    delete process.env.NEXT_PUBLIC_ADMIN_EMAILS;
  });

  it('returns 401 Unauthorized when userId is absent', async () => {
    vi.mocked(clerkServer.auth).mockResolvedValueOnce({ userId: null } as unknown as ReturnType<typeof clerkServer.auth> extends Promise<infer R> ? R : never);

    const result = await requireServerAdmin();
    expect(result.authorized).toBe(false);
    expect(result.errorResponse?.status).toBe(401);
  });

  it('returns 403 Forbidden when user has no email', async () => {
    vi.mocked(clerkServer.auth).mockResolvedValueOnce({ userId: 'user_1' } as unknown as ReturnType<typeof clerkServer.auth> extends Promise<infer R> ? R : never);
    vi.mocked(clerkServer.currentUser).mockResolvedValueOnce({ emailAddresses: [] } as unknown as ReturnType<typeof clerkServer.currentUser> extends Promise<infer R> ? R : never);

    const result = await requireServerAdmin();
    expect(result.authorized).toBe(false);
    expect(result.errorResponse?.status).toBe(403);
  });

  it('returns 403 Forbidden when user email is not in admin list', async () => {
    vi.mocked(clerkServer.auth).mockResolvedValueOnce({ userId: 'user_1' } as unknown as ReturnType<typeof clerkServer.auth> extends Promise<infer R> ? R : never);
    vi.mocked(clerkServer.currentUser).mockResolvedValueOnce({
      emailAddresses: [{ emailAddress: 'stranger@gmail.com' }],
    } as unknown as ReturnType<typeof clerkServer.currentUser> extends Promise<infer R> ? R : never);

    const result = await requireServerAdmin();
    expect(result.authorized).toBe(false);
    expect(result.errorResponse?.status).toBe(403);
  });

  it('authorizes admin user matching ADMIN_EMAILS', async () => {
    vi.mocked(clerkServer.auth).mockResolvedValueOnce({ userId: 'user_admin' } as unknown as ReturnType<typeof clerkServer.auth> extends Promise<infer R> ? R : never);
    vi.mocked(clerkServer.currentUser).mockResolvedValueOnce({
      emailAddresses: [{ emailAddress: 'admin@example.com' }],
    } as unknown as ReturnType<typeof clerkServer.currentUser> extends Promise<infer R> ? R : never);

    const result = await requireServerAdmin();
    expect(result.authorized).toBe(true);
    expect(result.userEmail).toBe('admin@example.com');
    expect(result.errorResponse).toBeUndefined();
  });
});
