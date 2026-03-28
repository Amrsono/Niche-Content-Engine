import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { batchRequestIndexing, getIndexingStatus } from '@/lib/indexing';
import { getPosts } from '@/lib/storage';

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmails =
    process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map((e) => e.trim().toLowerCase()) || [];
  return adminEmails.includes(email.toLowerCase());
}

/**
 * POST /api/indexing
 * Submits one or more blog URLs to the Google Indexing API for fast-track crawling.
 * Body: { urls?: string[], mode?: 'custom' | 'all' | 'latest' }
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;

    if (!isAdminEmail(email)) {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const mode: string = body.mode || 'custom';
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || 'https://niche-content-engine.vercel.app';

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
      // 'custom' mode — caller provides explicit URLs
      urls = Array.isArray(body.urls) ? body.urls : [];
    }

    if (urls.length === 0) {
      return NextResponse.json({ error: 'No URLs to index' }, { status: 400 });
    }

    const result = await batchRequestIndexing(urls);

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error('[API /indexing] Error:', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * GET /api/indexing?url=<encoded-url>
 * Check the Google Indexing API status/metadata for a specific URL.
 */
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;

    if (!isAdminEmail(email)) {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'Missing ?url= parameter' }, { status: 400 });
    }

    const status = await getIndexingStatus(decodeURIComponent(url));
    return NextResponse.json({ success: true, data: status });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
