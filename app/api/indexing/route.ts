import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { batchRequestIndexing, getIndexingStatus } from '@/lib/indexing';
import { getPosts } from '@/lib/storage';
import { isUserAdmin } from '@/lib/env';
import { logger } from '@/lib/logger';
import { stringifyError } from '@/lib/ai/utils';
import { IndexingRequestSchema, validateRequestBody } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;

    if (!isUserAdmin(email)) {
      return NextResponse.json({ success: false, error: 'Forbidden — admin only' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const validation = validateRequestBody(IndexingRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    const { mode, urls: inputUrls } = validation.data;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://niche-content-engine.vercel.app';

    let urls: string[] = [];

    if (mode === 'all') {
      const posts = await getPosts();
      urls = posts.map((p) => `${siteUrl}/blog/${p.slug}`);
    } else if (mode === 'latest') {
      const posts = await getPosts();
      if (posts.length > 0) {
        urls = [`${siteUrl}/blog/${posts[0].slug}`];
      }
    } else {
      urls = inputUrls || [];
    }

    if (urls.length === 0) {
      return NextResponse.json({ success: false, error: 'No URLs to index' }, { status: 400 });
    }

    const result = await batchRequestIndexing(urls);
    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const message = stringifyError(err);
    logger.error('Indexing API error', 'API/INDEXING', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;

    if (!isUserAdmin(email)) {
      return NextResponse.json({ success: false, error: 'Forbidden — admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ success: false, error: 'Missing ?url= parameter' }, { status: 400 });
    }

    const status = await getIndexingStatus(decodeURIComponent(url));
    return NextResponse.json({ success: true, data: status });
  } catch (err: unknown) {
    const message = stringifyError(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
