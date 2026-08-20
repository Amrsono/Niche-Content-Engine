"use client";

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { isUserAdmin } from '@/lib/env';

export interface AdminGuardState {
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
  isAdmin: boolean;
  userEmail: string | undefined;
}

export function useAdminGuard(redirectTo: string = '/blog'): AdminGuardState {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const isAdmin = Boolean(isSignedIn && isUserAdmin(userEmail));

  useEffect(() => {
    if (isLoaded && !isAdmin) {
      router.push(redirectTo);
    }
  }, [isLoaded, isAdmin, router, redirectTo]);

  return {
    isLoaded,
    isSignedIn,
    isAdmin,
    userEmail,
  };
}
