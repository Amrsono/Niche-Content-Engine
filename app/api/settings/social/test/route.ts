import { NextResponse } from 'next/server';
import { requireServerAdmin } from '@/lib/adminGuard.server';
import { getSettings } from '@/lib/storage';
import { env } from '@/lib/env';

export async function POST(req: Request) {
  const authRes = await requireServerAdmin();
  if (!authRes.authorized) {
    return authRes.errorResponse!;
  }

  try {
    const body = await req.json().catch(() => ({}));
    let token = body.facebookToken?.trim();
    let pageId = body.facebookPageId?.trim();

    if (!token) {
      const storedToken = await getSettings<string>('FACEBOOK_PAGE_ACCESS_TOKEN');
      token = (storedToken && storedToken.trim()) || process.env.FACEBOOK_PAGE_ACCESS_TOKEN || env.FACEBOOK_PAGE_ACCESS_TOKEN || '';
    }

    if (!pageId) {
      const storedPageId = await getSettings<string>('FACEBOOK_PAGE_ID');
      pageId = (storedPageId && storedPageId.trim()) || process.env.FACEBOOK_PAGE_ID || env.FACEBOOK_PAGE_ID || '';
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Facebook Page Access Token is missing' },
        { status: 400 }
      );
    }

    // Call Facebook Graph API to verify token
    const testUrl = pageId 
      ? `https://graph.facebook.com/v20.0/${pageId}?fields=id,name,category&access_token=${token}`
      : `https://graph.facebook.com/v20.0/me?fields=id,name&access_token=${token}`;

    const res = await fetch(testUrl);
    const data = await res.json();

    if (!res.ok || data.error) {
      return NextResponse.json(
        { 
          success: false, 
          error: data.error?.message || `Facebook API error (HTTP ${res.status})` 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Verified successfully! Connected to: "${data.name}" (ID: ${data.id})`,
      page: data,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Connection test failed' },
      { status: 500 }
    );
  }
}
