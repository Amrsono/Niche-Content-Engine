import { NextResponse } from 'next/server';
import { saveSettings } from '@/lib/storage';
import { logger } from '@/lib/logger';
import { stringifyError } from '@/lib/ai/utils';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://niche-content-engine.vercel.app';
  const redirectUri = `${siteUrl}/api/auth/tiktok/callback`;

  try {
    logger.info('Exchanging code for TikTok token...', 'TIKTOK_AUTH');
    const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache'
      },
      body: new URLSearchParams({
        client_key: clientKey || '',
        client_secret: clientSecret || '',
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      })
    });

    const data = await response.json();

    if (data.access_token) {
      logger.info('TikTok token received successfully', 'TIKTOK_AUTH');
      await saveSettings('tiktok_auth', {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + (data.expires_in * 1000),
        refresh_expires_at: Date.now() + (data.refresh_expires_in * 1000),
        open_id: data.open_id,
        scope: data.scope,
        updated_at: new Date().toISOString()
      });
      
      return NextResponse.redirect(`${siteUrl}/blog?tiktok=connected`);
    } else {
      logger.error('TikTok auth error response', 'TIKTOK_AUTH', data);
      return NextResponse.json(data, { status: 500 });
    }
  } catch (error: unknown) {
    logger.error('TikTok auth fetch error', 'TIKTOK_AUTH', error);
    return NextResponse.json({ error: stringifyError(error) }, { status: 500 });
  }
}
