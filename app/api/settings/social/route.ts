import { NextResponse } from 'next/server';
import { requireServerAdmin } from '@/lib/adminGuard.server';
import { saveSettings, getSettings } from '@/lib/storage';
import { env } from '@/lib/env';

function maskKey(key: string): string {
  if (!key) return '';
  if (key.length <= 12) return '••••••••';
  return `${key.slice(0, 6)}••••••••${key.slice(-6)}`;
}

export async function GET() {
  const authRes = await requireServerAdmin();
  if (!authRes.authorized) {
    return authRes.errorResponse!;
  }

  const storedToken = await getSettings<string>('FACEBOOK_PAGE_ACCESS_TOKEN');
  const activeToken = (storedToken && storedToken.trim()) || process.env.FACEBOOK_PAGE_ACCESS_TOKEN || env.FACEBOOK_PAGE_ACCESS_TOKEN || '';

  const storedPageId = await getSettings<string>('FACEBOOK_PAGE_ID');
  const activePageId = (storedPageId && storedPageId.trim()) || process.env.FACEBOOK_PAGE_ID || env.FACEBOOK_PAGE_ID || '';

  const storedIgId = await getSettings<string>('INSTAGRAM_BUSINESS_ACCOUNT_ID');
  const activeIgId = (storedIgId && storedIgId.trim()) || process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || env.INSTAGRAM_BUSINESS_ACCOUNT_ID || '';

  return NextResponse.json({
    success: true,
    facebookConfigured: Boolean(activeToken && activePageId),
    facebookPageId: activePageId,
    maskedFacebookToken: maskKey(activeToken),
    instagramAccountId: activeIgId,
    instagramConfigured: Boolean(activeToken && activeIgId),
  });
}

export async function POST(req: Request) {
  const authRes = await requireServerAdmin();
  if (!authRes.authorized) {
    return authRes.errorResponse!;
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { facebookToken, facebookPageId, instagramAccountId } = body;

    if (typeof facebookToken === 'string' && facebookToken.trim()) {
      const cleanToken = facebookToken.trim().replace(/['"]+/g, '');
      await saveSettings('FACEBOOK_PAGE_ACCESS_TOKEN', cleanToken);
      process.env.FACEBOOK_PAGE_ACCESS_TOKEN = cleanToken;
    }

    if (typeof facebookPageId === 'string' && facebookPageId.trim()) {
      const cleanPageId = facebookPageId.trim().replace(/['"]+/g, '');
      await saveSettings('FACEBOOK_PAGE_ID', cleanPageId);
      process.env.FACEBOOK_PAGE_ID = cleanPageId;
    }

    if (typeof instagramAccountId === 'string') {
      const cleanIgId = instagramAccountId.trim().replace(/['"]+/g, '');
      await saveSettings('INSTAGRAM_BUSINESS_ACCOUNT_ID', cleanIgId);
      process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID = cleanIgId;
    }

    const storedToken = await getSettings<string>('FACEBOOK_PAGE_ACCESS_TOKEN');
    const activeToken = (storedToken && storedToken.trim()) || process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '';
    const storedPageId = await getSettings<string>('FACEBOOK_PAGE_ID');
    const activePageId = (storedPageId && storedPageId.trim()) || process.env.FACEBOOK_PAGE_ID || '';

    return NextResponse.json({
      success: true,
      message: 'Social credentials saved successfully',
      facebookConfigured: Boolean(activeToken && activePageId),
      maskedFacebookToken: maskKey(activeToken),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save social settings' },
      { status: 500 }
    );
  }
}
