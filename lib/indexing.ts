import { google } from 'googleapis';
import { logger } from './logger';
import { captureException } from './errorTracking';
import { stringifyError } from './ai/utils';

const DAILY_QUOTA = 200; // Google's Indexing API limit

let cachedOffsetMs: number | null = null;
let lastOffsetCheck = 0;

/**
 * Probe Google's HTTP Date header to automatically compensate for local machine clock skew.
 */
async function getGoogleClockOffset(): Promise<number> {
  const now = Date.now();
  if (cachedOffsetMs !== null && now - lastOffsetCheck < 3600000) {
    return cachedOffsetMs;
  }
  try {
    const res = await fetch('https://www.google.com', { method: 'HEAD' });
    const dateHeader = res.headers.get('date');
    if (dateHeader) {
      const serverTime = new Date(dateHeader).getTime();
      const offset = serverTime - Date.now();
      cachedOffsetMs = offset;
      lastOffsetCheck = now;
      if (Math.abs(offset) > 30000) {
        logger.info(`Detected clock skew (${Math.round(offset / 1000)}s) with Google. Auto-calibrating JWT token timestamps.`, 'INDEXING');
      }
      return offset;
    }
  } catch (err) {
    logger.warn('Failed to probe Google server time for skew check', 'INDEXING', err);
  }
  return 0;
}

/**
 * Build an authenticated Google Indexing API client using a Service Account with clock-skew tolerance.
 */
async function getIndexingClient() {
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!b64) return null;

  try {
    const json = Buffer.from(b64, 'base64').toString('utf-8');
    const credentials = JSON.parse(json);

    const offset = await getGoogleClockOffset();
    const RealDate = Date;

    if (Math.abs(offset) > 30000) {
      class SkewedDate extends RealDate {
        constructor(...args: unknown[]) {
          if (args.length === 0) {
            super(RealDate.now() + offset);
          } else {
            // @ts-expect-error arguments forwarding
            super(...args);
          }
        }
        static now() {
          return RealDate.now() + offset;
        }
      }
      // @ts-expect-error dynamic class swap
      global.Date = SkewedDate;
    }

    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    await auth.authorize();
    return google.indexing({ version: 'v3', auth });
  } catch (err: unknown) {
    logger.error('Failed to build Google Indexing auth client', 'INDEXING', err);
    captureException(err, { module: 'INDEXING' });
    return null;
  }
}

export async function verifyIndexingSetup(): Promise<{
  configured: boolean;
  authenticated: boolean;
  serviceAccountEmail?: string;
  projectId?: string;
  error?: string;
}> {
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!b64) {
    return { configured: false, authenticated: false, error: 'GOOGLE_SERVICE_ACCOUNT_JSON missing' };
  }
  try {
    const credentials = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));
    const client = await getIndexingClient();
    return {
      configured: true,
      authenticated: client !== null,
      serviceAccountEmail: credentials.client_email,
      projectId: credentials.project_id,
      error: client ? undefined : 'JWT authorization failed'
    };
  } catch (e) {
    return { configured: true, authenticated: false, error: stringifyError(e) };
  }
}

export interface IndexingResult {
  url: string;
  success: boolean;
  notifyTime?: string;
  urlNotificationMetadata?: unknown;
  error?: string;
}

/**
 * Fast-Track Indexing: Force Google to crawl a single URL immediately.
 */
export async function requestIndexing(url: string): Promise<IndexingResult> {
  logger.info(`Fast-track crawl request for: ${url}`, 'INDEXING');

  const indexing = await getIndexingClient();

  if (!indexing) {
    logger.warn('No GOOGLE_SERVICE_ACCOUNT_JSON set. Running in mock mode.', 'INDEXING');
    return { url, success: true, error: 'mock_mode' };
  }

  try {
    const res = await indexing.urlNotifications.publish({
      requestBody: {
        url,
        type: 'URL_UPDATED',
      },
    });

    logger.info(`Google accepted crawl request for: ${url}`, 'INDEXING');
    return {
      url,
      success: true,
      notifyTime: res.data?.urlNotificationMetadata?.latestUpdate?.notifyTime ?? undefined,
      urlNotificationMetadata: res.data?.urlNotificationMetadata,
    };
  } catch (err: unknown) {
    const message = stringifyError(err);
    logger.warn(`Google rejected crawl request for ${url}: ${message}`, 'INDEXING');
    return { url, success: false, error: message };
  }
}

/**
 * Batch Fast-Track Indexing: Submit multiple URLs in sequence.
 */
export async function batchRequestIndexing(urls: string[]): Promise<{
  submitted: number;
  results: IndexingResult[];
  quotaWarning?: string;
}> {
  const limited = urls.slice(0, DAILY_QUOTA);
  const quotaWarning =
    urls.length > DAILY_QUOTA
      ? `Only ${DAILY_QUOTA} of ${urls.length} URLs were submitted (Google's daily quota limit).`
      : undefined;

  logger.info(`Batch submitting ${limited.length} URL(s) to Google...`, 'INDEXING');

  const results: IndexingResult[] = [];

  for (const url of limited) {
    const result = await requestIndexing(url);
    results.push(result);
    await new Promise((r) => setTimeout(r, 200));
  }

  const succeeded = results.filter((r) => r.success).length;
  logger.info(`Batch complete. ${succeeded}/${limited.length} URLs accepted.`, 'INDEXING');

  return { submitted: limited.length, results, quotaWarning };
}

/**
 * Get indexing status / metadata for a URL from Google.
 */
export async function getIndexingStatus(url: string): Promise<Record<string, unknown>> {
  const indexing = await getIndexingClient();
  if (!indexing) return { mock: true, url };

  try {
    const res = await indexing.urlNotifications.getMetadata({ url });
    return (res.data as Record<string, unknown>) || { url };
  } catch (err: unknown) {
    return { url, error: stringifyError(err) };
  }
}
