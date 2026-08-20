import { google } from 'googleapis';
import { logger } from './logger';
import { captureException } from './errorTracking';
import { stringifyError } from './ai/utils';

const DAILY_QUOTA = 200; // Google's Indexing API limit

/**
 * Build an authenticated Google Indexing API client using a Service Account.
 */
async function getIndexingClient() {
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!b64) return null;

  try {
    const json = Buffer.from(b64, 'base64').toString('utf-8');
    const credentials = JSON.parse(json);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    const client = await auth.getClient();
    return google.indexing({ version: 'v3', auth: client as never });
  } catch (err: unknown) {
    logger.error('Failed to build Google Indexing auth client', 'INDEXING', err);
    captureException(err, { module: 'INDEXING' });
    return null;
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
