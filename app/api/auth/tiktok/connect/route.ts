import { NextResponse } from 'next/server';

export async function GET() {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://niche-content-engine.vercel.app';
  const redirectUri = `${siteUrl}/api/auth/tiktok/callback`;
  
  // Scopes needed for Direct Post
  const scope = 'user.info.basic,video.publish,video.upload'; 
  const state = Math.random().toString(36).substring(2);

  const authUrl = `https://www.tiktok.com/v2/auth/authorize/` + 
    `?client_key=${clientKey}` +
    `&scope=${scope}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}`;

  console.log(`[TIKTOK AUTH] Redirecting to TikTok: ${authUrl}`);
  return NextResponse.redirect(authUrl);
}
