import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAdminGuard } from './useAdminGuard';
import * as clerkModule from '@clerk/nextjs';
import * as nextNavigation from 'next/navigation';

vi.mock('@clerk/nextjs', () => ({
  useUser: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

describe('useAdminGuard Hook', () => {
  const pushMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_ADMIN_EMAILS = 'admin@example.com';
    vi.mocked(nextNavigation.useRouter).mockReturnValue({
      push: pushMock,
    } as unknown as ReturnType<typeof nextNavigation.useRouter>);
  });

  it('redirects unauthorized user when loaded', () => {
    vi.mocked(clerkModule.useUser).mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      user: {
        primaryEmailAddress: { emailAddress: 'regular@user.com' },
      },
    } as unknown as ReturnType<typeof clerkModule.useUser>);

    const { result } = renderHook(() => useAdminGuard('/blog'));

    expect(result.current.isAdmin).toBe(false);
    expect(pushMock).toHaveBeenCalledWith('/blog');
  });

  it('allows authorized admin without redirect', () => {
    vi.mocked(clerkModule.useUser).mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      user: {
        primaryEmailAddress: { emailAddress: 'admin@example.com' },
      },
    } as unknown as ReturnType<typeof clerkModule.useUser>);

    const { result } = renderHook(() => useAdminGuard('/blog'));

    expect(result.current.isAdmin).toBe(true);
    expect(pushMock).not.toHaveBeenCalled();
  });
});
