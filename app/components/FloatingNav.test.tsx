import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { FloatingNav } from './FloatingNav';
import * as clerkModule from '@clerk/nextjs';

vi.mock('@clerk/nextjs', () => ({
  useUser: vi.fn(),
  UserButton: () => <div data-testid="user-button">UserButton</div>,
  SignInButton: ({ children }: { children: React.ReactNode }) => <div data-testid="signin-button">{children}</div>,
}));

describe('FloatingNav Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_ADMIN_EMAILS = 'admin@example.com';
  });

  it('renders standard navigation links for anonymous visitors', () => {
    vi.mocked(clerkModule.useUser).mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
      user: null,
    } as unknown as ReturnType<typeof clerkModule.useUser>);

    render(<FloatingNav />);

    expect(screen.getByText('Pulse Blog')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.queryByText('⚡ Fast-Index')).not.toBeInTheDocument();
    expect(screen.getByTestId('signin-button')).toBeInTheDocument();
  });

  it('renders admin navigation links for authenticated admin user', () => {
    vi.mocked(clerkModule.useUser).mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      user: {
        primaryEmailAddress: { emailAddress: 'admin@example.com' },
      },
    } as unknown as ReturnType<typeof clerkModule.useUser>);

    render(<FloatingNav />);

    expect(screen.getByText('Pulse Blog')).toBeInTheDocument();
    expect(screen.getByText('⚡ Fast-Index')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByTestId('user-button')).toBeInTheDocument();
  });
});
