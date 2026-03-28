import { google } from 'googleapis';

const DAILY_QUOTA = 200; // Google's Indexing API limit

/**
 * Build an authenticated Google Indexing API client using a Service Account.
 * The JSON key is stored base64-encoded in the GOOGLE_SERVICE_ACCOUNT_JSON env var.
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
    return google.indexing({ version: 'v3', auth: client as any });
  } catch (err: any) {
    console.error(`[INDEXING] Failed to build auth client: ${err.message}`);
    return null;
  }
}

export interface IndexingResult {
  url: string;
  success: boolean;
  notifyTime?: string;
  urlNotificationMetadata?: any;
  error?: string;
}

/**
 * Fast-Track Indexing: Force Google to crawl a single URL immediately.
 * Falls back to a soft-mock if no Service Account credentials are set.
 */
export async function requestIndexing(url: string): Promise<IndexingResult> {
  console.log(`[INDEXING] 🚀 Fast-track crawl request for: ${url}`);

  const indexing = await getIndexingClient();

  if (!indexing) {
    console.warn(
      `[INDEXING] ⚠️  No GOOGLE_SERVICE_ACCOUNT_JSON env var set. ` +
      `Running in mock mode — set up a Service Account in Google Cloud to activate real fast-track indexing.`
    );
    return { url, success: true, error: 'mock_mode' };
  }

  try {
    const res = await indexing.urlNotifications.publish({
      requestBody: {
        url,
        type: 'URL_UPDATED',
      },
    });

    console.log(`[INDEXING] ✅ Google accepted crawl request for: ${url}`);
    return {
      url,
      success: true,
      notifyTime: res.data?.urlNotificationMetadata?.latestUpdate?.notifyTime ?? undefined,
      urlNotificationMetadata: res.data?.urlNotificationMetadata,
    };
  } catch (err: any) {
    const message =
      err?.response?.data?.error?.message || err.message || String(err);
    console.warn(`[INDEXING] ❌ Google rejected crawl request for ${url}: ${message}`);
    return { url, success: false, error: message };
  }
}

/**
 * Batch Fast-Track Indexing: Submit multiple URLs in sequence.
 * Respects Google's 200 URL/day quota per API key.
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

  console.log(`[INDEXING] 📦 Batch submitting ${limited.length} URL(s) to Google...`);

  const results: IndexingResult[] = [];

  for (const url of limited) {
    const result = await requestIndexing(url);
    results.push(result);
    // Throttle: 200ms between requests to avoid rate-limit spikes
    await new Promise((r) => setTimeout(r, 200));
  }

  const succeeded = results.filter((r) => r.success).length;
  console.log(`[INDEXING] ✅ Batch complete. ${succeeded}/${limited.length} URLs accepted.`);

  return { submitted: limited.length, results, quotaWarning };
}

/**
 * Get the indexing status / metadata for a URL from Google.
 */
export async function getIndexingStatus(url: string): Promise<any> {
  const indexing = await getIndexingClient();
  if (!indexing) return { mock: true, url };

  try {
    const res = await indexing.urlNotifications.getMetadata({ url });
    return res.data;
  } catch (err: any) {
    return { url, error: err.message };
  }
}
