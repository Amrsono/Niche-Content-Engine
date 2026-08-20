import { getSettings, saveSettings } from '../storage';
import { logger } from '../logger';
import { env } from '../env';

export interface TikTokAuthData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  refresh_expires_at?: number;
  open_id?: string;
  scope?: string;
  token_type?: string;
  updated_at?: string;
}

const EXPIRATION_BUFFER_MS = 5 * 60 * 1000; // 5 minutes buffer

/**
 * Checks if a token is nearing expiration or already expired.
 */
export function isTokenExpired(expiresAt: number, bufferMs: number = EXPIRATION_BUFFER_MS): boolean {
  return Date.now() >= (expiresAt - bufferMs);
}

/**
 * Retrieves valid TikTok access token, automatically refreshing if expired or expiring soon.
 */
export async function getTikTokToken(): Promise<string | null> {
  const auth = await getSettings('tiktok_auth') as TikTokAuthData | null;
  if (!auth || !auth.access_token) {
    logger.debug('No TikTok auth settings found', 'TIKTOK');
    return null;
  }

  // If token is still fresh, return it
  if (!isTokenExpired(auth.expires_at)) {
    return auth.access_token;
  }

  // Token expired or near expiration, attempt refresh
  logger.info('TikTok token expiring or expired. Refreshing token...', 'TIKTOK');
  const clientKey = env.TIKTOK_CLIENT_KEY || process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = env.TIKTOK_CLIENT_SECRET || process.env.TIKTOK_CLIENT_SECRET;

  if (!clientKey || !clientSecret) {
    logger.error('Missing TikTok client credentials for token refresh', 'TIKTOK');
    return null;
  }

  try {
    const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: auth.refresh_token,
      }),
    });

    const data = await res.json();
    if (data.access_token) {
      const newAuth: TikTokAuthData = {
        ...auth,
        access_token: data.access_token,
        refresh_token: data.refresh_token || auth.refresh_token,
        expires_at: Date.now() + (Number(data.expires_in) * 1000),
        refresh_expires_at: data.refresh_expires_in
          ? Date.now() + (Number(data.refresh_expires_in) * 1000)
          : auth.refresh_expires_at,
        updated_at: new Date().toISOString(),
      };

      await saveSettings('tiktok_auth', newAuth);
      logger.info('TikTok token refreshed and saved successfully', 'TIKTOK');
      return data.access_token;
    } else {
      logger.error('TikTok refresh token endpoint returned error', 'TIKTOK', data);
      return null;
    }
  } catch (error) {
    logger.error('TikTok refresh fetch exception', 'TIKTOK', error);
    return null;
  }
}
