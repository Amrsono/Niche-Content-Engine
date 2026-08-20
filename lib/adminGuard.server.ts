import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { logger } from './logger';

export interface AdminAuthResult {
  authorized: boolean;
  userEmail?: string;
  errorResponse?: NextResponse;
}

/**
 * Server-side Admin Guard.
 * Reads private ADMIN_EMAILS (with fallback to NEXT_PUBLIC_ADMIN_EMAILS)
 * and verifies Clerk session authentication and email authorization on server routes.
 */
export async function requireServerAdmin(): Promise<AdminAuthResult> {
  try {
    const session = await auth();
    if (!session.userId) {
      logger.warn('Unauthorized API access attempt (no session userId)', 'AUTH_SERVER');
      return {
        authorized: false,
        errorResponse: NextResponse.json(
          { success: false, error: 'Unauthorized: Authentication session required' },
          { status: 401 }
        ),
      };
    }

    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress?.trim().toLowerCase();

    if (!userEmail) {
      logger.warn('User has no valid email address in Clerk profile', 'AUTH_SERVER');
      return {
        authorized: false,
        errorResponse: NextResponse.json(
          { success: false, error: 'Forbidden: No email address found in profile' },
          { status: 403 }
        ),
      };
    }

    const rawAdminEmails = process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
    const adminList = rawAdminEmails
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const isAdmin = adminList.includes(userEmail);

    if (!isAdmin) {
      logger.warn(`Forbidden API access attempt by non-admin: ${userEmail}`, 'AUTH_SERVER');
      return {
        authorized: false,
        errorResponse: NextResponse.json(
          { success: false, error: 'Forbidden: Administrator privileges required' },
          { status: 403 }
        ),
      };
    }

    return {
      authorized: true,
      userEmail,
    };
  } catch (error) {
    logger.error('Exception during server admin authorization check', 'AUTH_SERVER', error);
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { success: false, error: 'Internal server error during authorization' },
        { status: 500 }
      ),
    };
  }
}
