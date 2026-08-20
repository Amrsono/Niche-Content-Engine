import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { AdminGuard } from './AdminGuard';
import * as adminGuardHook from '@/app/hooks/useAdminGuard';

vi.mock('@/app/hooks/useAdminGuard', () => ({
  useAdminGuard: vi.fn(),
}));

describe('AdminGuard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading indicator while Clerk auth is loading', () => {
    vi.mocked(adminGuardHook.useAdminGuard).mockReturnValue({
      isLoaded: false,
      isSignedIn: undefined,
      isAdmin: false,
      userEmail: undefined,
    });

    const { container } = render(
      <AdminGuard>
        <div>Admin Protected Content</div>
      </AdminGuard>
    );

    expect(screen.queryByText('Admin Protected Content')).not.toBeInTheDocument();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders nothing when user is loaded but not an admin', () => {
    vi.mocked(adminGuardHook.useAdminGuard).mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      isAdmin: false,
      userEmail: 'regular@user.com',
    });

    render(
      <AdminGuard>
        <div>Admin Protected Content</div>
      </AdminGuard>
    );

    expect(screen.queryByText('Admin Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when user is loaded and authenticated as admin', () => {
    vi.mocked(adminGuardHook.useAdminGuard).mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      isAdmin: true,
      userEmail: 'admin@example.com',
    });

    render(
      <AdminGuard>
        <div>Admin Protected Content</div>
      </AdminGuard>
    );

    expect(screen.getByText('Admin Protected Content')).toBeInTheDocument();
  });
});
